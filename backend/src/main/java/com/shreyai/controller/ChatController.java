package com.shreyai.controller;

import com.shreyai.dto.ApiResponse;
import com.shreyai.dto.CreateConversationRequest;
import com.shreyai.dto.EditMessageRequest;
import com.shreyai.dto.UpdateConversationRequest;
import com.shreyai.model.ChatMessage;
import com.shreyai.model.Conversation;
import com.shreyai.security.CustomUserDetails;
import com.shreyai.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    /**
     * Get all conversations for current authenticated user.
     */
    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<Conversation>>> getConversations(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<Conversation> conversations = chatService.getUserConversations(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Conversations retrieved successfully", conversations));
    }

    /**
     * Create a new conversation thread.
     */
    @PostMapping("/conversations")
    public ResponseEntity<ApiResponse<Conversation>> createConversation(
            @RequestBody(required = false) CreateConversationRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Conversation conversation = chatService.createConversation(userDetails.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Conversation created successfully", conversation));
    }

    /**
     * Get conversation details and all messages.
     */
    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getConversationWithMessages(
            @PathVariable String conversationId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Conversation conversation = chatService.getConversation(conversationId, userDetails.getId());
        List<ChatMessage> messages = chatService.getConversationMessages(conversationId, userDetails.getId());

        Map<String, Object> data = new HashMap<>();
        data.put("conversation", conversation);
        data.put("messages", messages);

        return ResponseEntity.ok(ApiResponse.success("Conversation and messages retrieved", data));
    }

    /**
     * Update conversation title or pinned status.
     */
    @PutMapping("/conversations/{conversationId}")
    public ResponseEntity<ApiResponse<Conversation>> updateConversation(
            @PathVariable String conversationId,
            @Valid @RequestBody UpdateConversationRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Conversation updated = chatService.updateConversation(conversationId, userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Conversation updated successfully", updated));
    }

    /**
     * Delete an entire conversation thread and all its messages.
     */
    @DeleteMapping("/conversations/{conversationId}")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(
            @PathVariable String conversationId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        chatService.deleteConversation(conversationId, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Conversation deleted successfully"));
    }

    /**
     * Edit a specific user chat message.
     */
    @PutMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<ChatMessage>> editMessage(
            @PathVariable String messageId,
            @Valid @RequestBody EditMessageRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        ChatMessage updated = chatService.editMessage(messageId, userDetails.getId(), request.getContent());
        return ResponseEntity.ok(ApiResponse.success("Message edited successfully", updated));
    }

    /**
     * Delete a specific chat message.
     */
    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(
            @PathVariable String messageId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        chatService.deleteMessage(messageId, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Message deleted successfully"));
    }
}

