import os
from typing import Dict, Any, Generator
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from agent.llm import get_llm
from agent.tools import ALL_TOOLS
from agent.prompts import SHREY_SYSTEM_PROMPT

# In-memory checkpointer for multi-turn conversational persistence
memory = MemorySaver()

# Cache compiled agent instances
_cached_agents: Dict[str, Any] = {}


def get_agent(provider: str = None):
    """
    Retrieve or initialize the compiled LangGraph ReAct agent for the requested provider.
    """
    key = provider or "default"
    if key not in _cached_agents:
        llm = get_llm(provider=provider)
        agent = create_react_agent(
            model=llm,
            tools=ALL_TOOLS,
            prompt=SHREY_SYSTEM_PROMPT,
            checkpointer=memory
        )
        _cached_agents[key] = agent
    return _cached_agents[key]


def chat_with_shrey(message: str, thread_id: str = "default", provider: str = None) -> Dict[str, Any]:
    """
    Execute a turn with Shrey AI, returning the final answer, any tools invoked, and provider used.
    """
    agent = get_agent(provider=provider)
    config = {"configurable": {"thread_id": thread_id}}
    
    inputs = {"messages": [HumanMessage(content=message)]}
    result = agent.invoke(inputs, config=config)
    
    messages = result.get("messages", [])
    final_message = messages[-1] if messages else None
    
    # Extract executed tool calls for transparency
    tools_used = []
    for msg in messages:
        if hasattr(msg, "tool_calls") and msg.tool_calls:
            for tc in msg.tool_calls:
                tools_used.append(tc.get("name"))
        elif getattr(msg, "type", None) == "tool":
            tool_name = getattr(msg, "name", "tool")
            if tool_name not in tools_used:
                tools_used.append(tool_name)

    return {
        "response": final_message.content if final_message else "No response generated.",
        "tools_used": list(set(tools_used)),
        "thread_id": thread_id,
        "provider": provider or os.getenv("DEFAULT_LLM_PROVIDER", "groq")
    }
