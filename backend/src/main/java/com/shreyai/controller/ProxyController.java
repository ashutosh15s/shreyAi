package com.shreyai.controller;

import com.shreyai.dto.ApiResponse;
import com.shreyai.security.CustomUserDetails;
import com.shreyai.service.AuditLogService;
import com.shreyai.service.RateLimitService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/gateway")
public class ProxyController {

    private final RateLimitService rateLimitService;
    private final AuditLogService auditLogService;

    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;

    public ProxyController(RateLimitService rateLimitService, AuditLogService auditLogService) {
        this.rateLimitService = rateLimitService;
        this.auditLogService = auditLogService;
    }

    /**
     * Pre-flight / gateway rate check endpoint.
     * Verifies that the authenticated user has not exceeded limits for a given LLM provider.
     */
    @PostMapping("/rate-check")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkRateLimit(
            @RequestParam(defaultValue = "groq") String provider,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        rateLimitService.checkRateLimit(userDetails.getId(), provider);

        Map<String, Object> data = new HashMap<>();
        data.put("allowed", true);
        data.put("provider", provider);
        data.put("userId", userDetails.getId());

        return ResponseEntity.ok(ApiResponse.success("Rate limit check passed", data));
    }

    /**
     * Gateway status and downstream target configuration endpoint.
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getGatewayStatus(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Map<String, Object> status = new HashMap<>();
        status.put("gateway", "active");
        status.put("aiServiceConfiguredUrl", aiServiceUrl);
        status.put("authenticatedUser", userDetails.getUsername());
        status.put("role", userDetails.getRole().name());

        return ResponseEntity.ok(ApiResponse.success("Gateway status operational", status));
    }
}
