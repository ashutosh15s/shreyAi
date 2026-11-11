package com.shreyai.controller;

import com.shreyai.dto.ApiResponse;
import com.shreyai.security.CustomUserDetails;
import com.shreyai.service.AuditLogService;
import com.shreyai.service.RateLimitService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiProxyController {

    private final RateLimitService rateLimitService;
    private final AuditLogService auditLogService;
    private final RestClient restClient;
    private final String aiServiceUrl;

    public AiProxyController(
            RateLimitService rateLimitService,
            AuditLogService auditLogService,
            @Value("${ai.service.url:http://localhost:8000}") String aiServiceUrl
    ) {
        this.rateLimitService = rateLimitService;
        this.auditLogService = auditLogService;
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
     * Enforces per-user per-provider rate limits, scopes thread memory, and records an audit log.
     */
    @PostMapping("/chat")
    public ResponseEntity<?> proxyChat(
            @RequestBody Map<String, Object> requestBody,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String provider = (String) requestBody.getOrDefault("provider", "groq");
        rateLimitService.checkRateLimit(userDetails.getId(), provider);

        // Ensure session memory thread is uniquely scoped to this user if not custom
        Map<String, Object> payload = new HashMap<>(requestBody);
        if (!payload.containsKey("thread_id") || "default".equals(payload.get("thread_id"))) {
            payload.put("thread_id", "user_" + userDetails.getId());
        }

        try {
            ResponseEntity<Map> downstream = restClient.post()
                    .uri("/ai/chat")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toEntity(Map.class);

            auditLogService.log(userDetails.getId(), "AI_CHAT_COMPLETED", provider, null, "Provider used: " + provider);
            return ResponseEntity.status(downstream.getStatusCode()).body(downstream.getBody());
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
