"""
Chat Pipeline Architecture for Shrey AI.
Manages request lifecycle, preprocessing, agent routing, and dual-modality output dispatch.
"""

from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from agent.core import ShreyAgent, AgentInput, AgentOutput


class ChatPipelineRequest(BaseModel):
    message: str = Field(..., description="User input text query or voice transcript")
    thread_id: Optional[str] = Field("default", description="Conversation session ID")
    provider: Optional[str] = Field(None, description="Preferred provider: groq, openrouter, or gemini")
    include_voice_script: bool = Field(True, description="Generate phonetically cleaned script for TTS")
    history: Optional[List[Dict[str, str]]] = Field(default=None, description="Prior conversational turns for persistent memory")


class ChatPipelineResponse(BaseModel):
    response: str = Field(..., description="Formatted markdown response for UI display")
    voice_script: Optional[str] = Field(None, description="Speech-optimized text for TTS engine")
    tools_executed: List[str] = Field(default_factory=list, description="Tools executed during turn")
    thread_id: str
    provider: str
    status: str = "success"


class ChatPipeline:
    """
    Class-based pipeline coordinating conversational turns with Shrey AI.
    """

    def __init__(self):
        self._agents: Dict[str, ShreyAgent] = {}

    def _get_agent(self, provider: Optional[str] = None) -> ShreyAgent:
        key = (provider or "default").lower()
        if key not in self._agents:
            self._agents[key] = ShreyAgent(provider=provider)
        return self._agents[key]

    def execute(self, request: ChatPipelineRequest) -> ChatPipelineResponse:
        """
        Execute full conversational pipeline turn.
        """
        # 1. Preprocessing & Input Sanitization
        cleaned_text = request.message.strip()
        if not cleaned_text:
            return ChatPipelineResponse(
                response="Please provide a message or voice input.",
                voice_script="Please provide a message or voice input.",
                tools_executed=[],
                thread_id=request.thread_id or "default",
                provider=request.provider or "none",
                status="empty_input"
            )

        # 2. Agent Routing & Execution
        agent = self._get_agent(provider=request.provider)
        agent_input = AgentInput(
            text=cleaned_text,
            thread_id=request.thread_id or "default",
            provider=request.provider,
            history=request.history
        )

        agent_output: AgentOutput = agent.process(agent_input)

        # 3. Postprocessing & Output Structuring
        return ChatPipelineResponse(
            response=agent_output.text,
            voice_script=agent_output.voice_text if request.include_voice_script else None,
            tools_executed=agent_output.tools_used,
            thread_id=agent_output.thread_id,
            provider=agent_output.provider,
            status=agent_output.status
        )

