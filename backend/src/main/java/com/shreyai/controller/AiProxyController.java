package com.shreyai.controller;

import com.shreyai.dto.ApiResponse;
import com.shreyai.dto.CreateConversationRequest;
import com.shreyai.model.ChatMessage;
import com.shreyai.model.Conversation;
import com.shreyai.security.CustomUserDetails;
import com.shreyai.service.AuditLogService;
import com.shreyai.service.ChatService;
import com.shreyai.service.RateLimitService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiProxyController {

    private final RateLimitService rateLimitService;
    private final AuditLogService auditLogService;
    private final ChatService chatService;
    private final RestClient restClient;
    private final String aiServiceUrl;

    public AiProxyController(
            RateLimitService rateLimitService,
            AuditLogService auditLogService,
            ChatService chatService,
            @Value("${ai.service.url:http://localhost:8000}") String aiServiceUrl
    ) {
        this.rateLimitService = rateLimitService;
        this.auditLogService = auditLogService;
        this.chatService = chatService;
        this.aiServiceUrl = aiServiceUrl;

        // Configure request factory with ample timeout for agentic tool reasoning & LLM calls
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(120000);

        this.restClient = RestClient.builder()
                .baseUrl(aiServiceUrl)
                .requestFactory(factory)
                .build();
    }

    /**
     * Proxy conversational chat request to FastAPI downstream.
     * Enforces per-user per-provider rate limits, persists chat history in MongoDB Atlas,
     * seeds agent multi-turn memory from past turns, and records audit logs.
     */
    @PostMapping("/chat")
    public ResponseEntity<?> proxyChat(
            @RequestBody Map<String, Object> requestBody,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String provider = (String) requestBody.getOrDefault("provider", "groq");
        rateLimitService.checkRateLimit(userDetails.getId(), provider);

        String userMessage = (String) requestBody.get("message");
        if (userMessage == null || userMessage.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Message content cannot be blank"));
        }

        // 1. Resolve or auto-create conversation
        String conversationId = (String) requestBody.get("conversationId");
        if (conversationId == null || conversationId.isBlank()) {
            conversationId = (String) requestBody.get("conversation_id");
        }

        Conversation conversation;
        if (conversationId == null || conversationId.isBlank()) {
            conversation = chatService.createConversation(
                    userDetails.getId(),
                    new CreateConversationRequest("New Chat", provider)
            );
            conversationId = conversation.getId();
        } else {
            conversation = chatService.getConversation(conversationId, userDetails.getId());
        }

        // 2. Persist user message to MongoDB Atlas
        ChatMessage savedUserMsg = chatService.saveUserMessage(conversationId, userDetails.getId(), userMessage);

        // 3. Fetch prior conversation turns for persistent agent memory context
        List<ChatMessage> priorMessages = chatService.getRecentContextMessages(conversationId, userDetails.getId(), 10);
        List<Map<String, String>> historyList = new ArrayList<>();
        for (ChatMessage msg : priorMessages) {
            // Exclude the message we just saved to avoid duplicates
            if (!msg.getId().equals(savedUserMsg.getId())) {
                Map<String, String> item = new HashMap<>();
                item.put("role", msg.getRole());
                item.put("content", msg.getContent());
                historyList.add(item);
            }
        }

        // 4. Build downstream payload
        Map<String, Object> payload = new HashMap<>(requestBody);
        payload.put("thread_id", conversationId);
        payload.put("history", historyList);

        try {
            ResponseEntity<Map> downstream = restClient.post()
                    .uri("/ai/chat")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toEntity(Map.class);

            Map<String, Object> responseBody = downstream.getBody();
            if (responseBody != null) {
                String responseText = (String) responseBody.get("response");
                String voiceScript = (String) responseBody.get("voice_script");
                List<String> toolsUsed = (List<String>) responseBody.getOrDefault("tools_executed", new ArrayList<>());

                // 5. Persist assistant message to MongoDB Atlas
                ChatMessage savedAssistantMsg = chatService.saveAssistantMessage(
                        conversationId,
                        userDetails.getId(),
                        responseText,
                        voiceScript,
                        provider,
                        toolsUsed
                );

                // Enrich client response with conversation and message metadata
                responseBody.put("conversationId", conversationId);
                responseBody.put("userMessageId", savedUserMsg.getId());
                responseBody.put("assistantMessageId", savedAssistantMsg.getId());
            }

            auditLogService.log(userDetails.getId(), "AI_CHAT_COMPLETED", provider, null, "Conversation: " + conversationId);
            return ResponseEntity.status(downstream.getStatusCode()).body(responseBody);
        } catch (Exception e) {
            auditLogService.log(userDetails.getId(), "AI_CHAT_FAILED", provider, null, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(ApiResponse.error("AI Service downstream error: " + e.getMessage()));
        }
    }

    /**
     * Ingest custom document/knowledge into ChromaDB vector store via FastAPI.
     */
    @PostMapping("/rag/ingest")
    public ResponseEntity<?> proxyRagIngest(
            @RequestBody Map<String, Object> requestBody,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        try {
            ResponseEntity<Map> downstream = restClient.post()
                    .uri("/ai/rag/ingest")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .toEntity(Map.class);

            auditLogService.log(userDetails.getId(), "AI_RAG_INGEST", "system", null, "Ingested knowledge");
            return ResponseEntity.status(downstream.getStatusCode()).body(downstream.getBody());
        } catch (Exception e) {
            auditLogService.log(userDetails.getId(), "AI_RAG_INGEST_FAILED", "system", null, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(ApiResponse.error("AI RAG Ingest downstream error: " + e.getMessage()));
        }
    }

    /**
     * Query ChromaDB vector knowledge base via FastAPI.
     */
    @PostMapping("/rag/query")
    public ResponseEntity<?> proxyRagQuery(
            @RequestBody Map<String, Object> requestBody,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        try {
            ResponseEntity<Map> downstream = restClient.post()
                    .uri("/ai/rag/query")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .toEntity(Map.class);

            auditLogService.log(userDetails.getId(), "AI_RAG_QUERY", "system", null, "Query performed");
            return ResponseEntity.status(downstream.getStatusCode()).body(downstream.getBody());
        } catch (Exception e) {
            auditLogService.log(userDetails.getId(), "AI_RAG_QUERY_FAILED", "system", null, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(ApiResponse.error("AI RAG Query downstream error: " + e.getMessage()));
        }
    }

    /**
     * Confirmation Layer for sensitive tasks (process kill, delete, workstation lock).
     * Receives user approval/rejection from frontend permission UI and passes to AI downstream.
     */
    @PostMapping("/confirm")
    public ResponseEntity<?> confirmAction(
            @RequestBody Map<String, Object> requestBody,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String actionId = (String) requestBody.get("actionId");
        if (actionId == null) {
            actionId = (String) requestBody.get("action_id");
        }
        String actionType = (String) requestBody.get("actionType");
        if (actionType == null) {
            actionType = (String) requestBody.get("action_type");
        }
        Boolean approved = (Boolean) requestBody.get("approved");
        if (approved == null) {
            approved = true;
        }

        Map<String, Object> payload = new HashMap<>(requestBody);
        payload.put("action_id", actionId != null ? actionId : "act_" + System.currentTimeMillis());
        payload.put("action_type", actionType != null ? actionType : "custom");
        payload.put("approved", approved);
        payload.put("user_id", userDetails.getId());

        try {
            ResponseEntity<Map> downstream = restClient.post()
                    .uri("/ai/confirm")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toEntity(Map.class);

            String logAction = Boolean.TRUE.equals(approved) ? "AI_ACTION_APPROVED" : "AI_ACTION_REJECTED";
            auditLogService.log(userDetails.getId(), logAction, "confirmation", null, "Action: " + actionType);

            return ResponseEntity.status(downstream.getStatusCode()).body(downstream.getBody());
        } catch (Exception e) {
            auditLogService.log(userDetails.getId(), "AI_ACTION_CONFIRM_FAILED", "confirmation", null, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(ApiResponse.error("Confirmation error: " + e.getMessage()));
        }
    }

    /**
     * Downstream health probe for FastAPI.
     */
    @GetMapping("/health")
    public ResponseEntity<?> proxyHealth() {
        try {
            ResponseEntity<Map> downstream = restClient.get()
                    .uri("/health")
                    .retrieve()
                    .toEntity(Map.class);
            return ResponseEntity.status(downstream.getStatusCode()).body(downstream.getBody());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(ApiResponse.error("AI Service downstream unreachable: " + e.getMessage()));
        }
    }

    /**
     * Downstream status probe for FastAPI.
     */
    @GetMapping("/status")
    public ResponseEntity<?> proxyStatus() {
        try {
            ResponseEntity<Map> downstream = restClient.get()
                    .uri("/ai/status")
                    .retrieve()
                    .toEntity(Map.class);
            return ResponseEntity.status(downstream.getStatusCode()).body(downstream.getBody());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(ApiResponse.error("AI Service downstream unreachable: " + e.getMessage()));
        }
    }
}
