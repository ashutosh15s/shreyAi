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
    history: Optional[List[Dict[str, str]]] = Field(default=None, description="Prior conversational turns for persistent memory")


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
        """Build and compile the LangGraph ReAct agent graph with explicit SystemMessage."""
        llm = get_llm(provider=self.provider)
        self._compiled_graph = create_react_agent(
            model=llm,
            tools=self.tools,
            prompt=SystemMessage(content=self.system_prompt),
            checkpointer=self.memory
        )

    def process(self, input_data: AgentInput) -> AgentOutput:
        """
        Execute an agentic reasoning turn.
        Takes text input, executes any necessary tools, and returns a structured output.
        """
        config = {"configurable": {"thread_id": input_data.thread_id}}

        # Ensure SystemMessage and any passed persistent history are explicitly seeded
        try:
            state = self._compiled_graph.get_state(config)
            existing_messages = state.values.get("messages", []) if state and state.values else []
        except Exception:
            existing_messages = []

        if not existing_messages or not any(isinstance(m, SystemMessage) for m in existing_messages):
            message_payload = [SystemMessage(content=self.system_prompt)]
            if input_data.history:
                for h in input_data.history:
                    r = h.get("role", "user")
                    c = h.get("content", "")
                    if c:
                        if r == "user":
                            message_payload.append(HumanMessage(content=c))
                        elif r == "assistant":
                            message_payload.append(AIMessage(content=c))
            message_payload.append(HumanMessage(content=input_data.text))
        else:
            message_payload = [HumanMessage(content=input_data.text)]

        inputs = {"messages": message_payload}

        try:
            result = self._compiled_graph.invoke(inputs, config=config)
            messages = result.get("messages", [])
            final_message = messages[-1] if messages else None
            raw_content = final_message.content if final_message else "I was unable to formulate a response."

            # Normalize response_text if the LLM (like Gemini) returns a list of parts
            if isinstance(raw_content, list):
                text_parts = []
                for part in raw_content:
                    if isinstance(part, str):
                        text_parts.append(part)
                    elif isinstance(part, dict) and "text" in part:
                        text_parts.append(part["text"])
                    elif hasattr(part, "text"):
                        text_parts.append(part.text)
                response_text = "\n".join(text_parts)
            else:
                response_text = str(raw_content)

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

