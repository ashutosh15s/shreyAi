"""
Object-Oriented ShreyAgent Core Class.
Manages LLM providers, tool execution, multi-turn state, and the LangGraph ReAct loop.
"""

import os
from typing import Dict, Any, List, Optional, Generator
from pydantic import BaseModel, Field

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver

from agent.llm import get_llm
from agent.tools import ALL_TOOLS
from agent.prompts import SHREY_SYSTEM_PROMPT


class AgentInput(BaseModel):
    text: str = Field(..., description="User prompt or transcribed voice input")
    thread_id: str = Field("default", description="Conversation thread session identifier")
    provider: Optional[str] = Field(None, description="Preferred LLM provider: groq, openrouter, or gemini")


class AgentOutput(BaseModel):
    text: str = Field(..., description="Agent final response text")
    voice_text: str = Field(..., description="TTS-optimized spoken text")
    tools_used: List[str] = Field(default_factory=list, description="Names of all tools executed in this turn")
    thread_id: str
    provider: str
    status: str = "success"


class ShreyAgent:
    """
    Production-grade Agent class orchestrating LLM tool-calling,
    state persistence, and dual-modality output generation.
    """

    def __init__(self, provider: Optional[str] = None):
        self.provider = provider or os.getenv("DEFAULT_LLM_PROVIDER", "groq")
        self.memory = MemorySaver()
        self.tools = ALL_TOOLS
        self.system_prompt = SHREY_SYSTEM_PROMPT
        self._compiled_graph = None
        self._initialize_graph()

    def _initialize_graph(self):
        """Build and compile the LangGraph ReAct agent graph."""
        llm = get_llm(provider=self.provider)
        self._compiled_graph = create_react_agent(
            model=llm,
            tools=self.tools,
            prompt=self.system_prompt,
            checkpointer=self.memory
        )

    def process(self, input_data: AgentInput) -> AgentOutput:
        """
        Execute an agentic reasoning turn.
        Takes text input, executes any necessary tools, and returns a structured output.
        """
        config = {"configurable": {"thread_id": input_data.thread_id}}
        inputs = {"messages": [HumanMessage(content=input_data.text)]}

        try:
            result = self._compiled_graph.invoke(inputs, config=config)
            messages = result.get("messages", [])
            final_message = messages[-1] if messages else None
            response_text = final_message.content if final_message else "I was unable to formulate a response."

            # Extract any tools invoked during the ReAct loop
            tools_used = []
            for msg in messages:
                if hasattr(msg, "tool_calls") and msg.tool_calls:
                    for tc in msg.tool_calls:
                        tools_used.append(tc.get("name"))
                elif getattr(msg, "type", None) == "tool":
                    tool_name = getattr(msg, "name", "tool")
                    if tool_name not in tools_used:
                        tools_used.append(tool_name)

            # Generate TTS-friendly voice script (strips code fences, links, markdown headers)
            voice_script = self._clean_for_speech(response_text)

            return AgentOutput(
                text=response_text,
                voice_text=voice_script,
                tools_used=list(set(tools_used)),
                thread_id=input_data.thread_id,
                provider=self.provider,
                status="success"
            )

        except Exception as e:
            return AgentOutput(
                text=f"Agent execution encountered an error: {str(e)}",
                voice_text="I encountered an error while processing your request.",
                tools_used=[],
                thread_id=input_data.thread_id,
                provider=self.provider,
                status="error"
            )

    @staticmethod
    def _clean_for_speech(text: str) -> str:
        """Clean markdown formatting for natural vocal output by TTS."""
        import re
        # Remove markdown code blocks
        clean = re.sub(r'```.*?```', 'code block omitted for voice.', text, flags=re.DOTALL)
        # Remove bold, italics, backticks
        clean = re.sub(r'[*_`#]', '', clean)
        # Remove URLs
        clean = re.sub(r'https?://\S+', '', clean)
        # Collapse multiple spaces and linebreaks
        clean = ' '.join(clean.split())
        return clean

