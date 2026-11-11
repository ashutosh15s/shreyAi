package com.shreyai.controller;

import com.shreyai.dto.ApiResponse;
import com.shreyai.security.CustomUserDetails;
import com.shreyai.service.AuditLogService;
import com.shreyai.service.RateLimitService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;

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
        this.restClient = RestClient.builder().baseUrl(aiServiceUrl).build();
    }

    /**
     * Proxy conversational chat request to FastAPI downstream.
     * Enforces per-user per-provider rate limits and records an audit log.
     */
    @PostMapping("/chat")
    public ResponseEntity<?> proxyChat(
            @RequestBody Map<String, Object> requestBody,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String provider = (String) requestBody.getOrDefault("provider", "groq");
        rateLimitService.checkRateLimit(userDetails.getId(), provider);

        try {
            ResponseEntity<Map> downstream = restClient.post()
                    .uri("/ai/chat")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .toEntity(Map.class);

            auditLogService.logAction(userDetails.getId(), "AI_CHAT_COMPLETED", provider, "Provider used: " + provider);
            return ResponseEntity.status(downstream.getStatusCode()).body(downstream.getBody());
        } catch (Exception e) {
            auditLogService.logAction(userDetails.getId(), "AI_CHAT_FAILED", provider, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(ApiResponse.error(502, "AI Service downstream unreachable: " + e.getMessage()));
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
                    .body(ApiResponse.error(502, "AI Service downstream unreachable: " + e.getMessage()));
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
                    .body(ApiResponse.error(502, "AI Service downstream unreachable: " + e.getMessage()));
        }
    }
}
