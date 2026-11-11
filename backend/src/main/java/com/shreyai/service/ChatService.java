package com.shreyai.service;

import com.shreyai.dto.CreateConversationRequest;
import com.shreyai.dto.UpdateConversationRequest;
import com.shreyai.exception.ResourceNotFoundException;
import com.shreyai.model.ChatMessage;
import com.shreyai.model.Conversation;
import com.shreyai.repository.ChatMessageRepository;
import com.shreyai.repository.ConversationRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

@Service
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final AuditLogService auditLogService;

    public ChatService(
            ConversationRepository conversationRepository,
            ChatMessageRepository chatMessageRepository,
            AuditLogService auditLogService
    ) {
        this.conversationRepository = conversationRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.auditLogService = auditLogService;
    }

    public Conversation createConversation(String userId, CreateConversationRequest request) {
        String title = (request != null && request.getTitle() != null && !request.getTitle().isBlank())
                ? request.getTitle().trim()
                : "New Chat";
        String provider = (request != null && request.getModelProvider() != null)
                ? request.getModelProvider()
                : "groq";

        Conversation conversation = new Conversation(userId, title, provider);
        Conversation saved = conversationRepository.save(conversation);
        auditLogService.log(userId, "CONVERSATION_CREATED", provider, null, "Created conversation: " + saved.getId());
        return saved;
    }

    public List<Conversation> getUserConversations(String userId) {
        return conversationRepository.findByUserIdOrderByUpdatedAtDesc(userId);
    }

    public Conversation getConversation(String conversationId, String userId) {
        return conversationRepository.findByIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + conversationId));
    }

    public Conversation updateConversation(String conversationId, String userId, UpdateConversationRequest request) {
        Conversation conversation = getConversation(conversationId, userId);

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            conversation.setTitle(request.getTitle().trim());
        }
        if (request.getIsPinned() != null) {
            conversation.setPinned(request.getIsPinned());
        }
        conversation.setUpdatedAt(Instant.now());

        Conversation updated = conversationRepository.save(conversation);
        auditLogService.log(userId, "CONVERSATION_UPDATED", null, null, "Updated conversation: " + conversationId);
        return updated;
    }

    public void deleteConversation(String conversationId, String userId) {
        Conversation conversation = getConversation(conversationId, userId);
        
        // Cascade delete all messages belonging to this conversation
        chatMessageRepository.deleteByConversationIdAndUserId(conversationId, userId);
        conversationRepository.delete(conversation);

        auditLogService.log(userId, "CONVERSATION_DELETED", null, null, "Deleted conversation and messages: " + conversationId);
    }

    public List<ChatMessage> getConversationMessages(String conversationId, String userId) {
        // Verify conversation ownership first
        getConversation(conversationId, userId);
        return chatMessageRepository.findByConversationIdAndUserIdOrderByTimestampAsc(conversationId, userId);
    }

    public List<ChatMessage> getRecentContextMessages(String conversationId, String userId, int limit) {
        List<ChatMessage> recent = chatMessageRepository.findTop10ByConversationIdAndUserIdOrderByTimestampDesc(conversationId, userId);
        Collections.reverse(recent); // Restore chronological order
        return recent;
    }

    public ChatMessage saveUserMessage(String conversationId, String userId, String content) {
        ChatMessage message = new ChatMessage(conversationId, userId, "user", content);
        ChatMessage saved = chatMessageRepository.save(message);

        // Update conversation's updatedAt timestamp
        conversationRepository.findByIdAndUserId(conversationId, userId).ifPresent(c -> {
            // Auto-set title from first message if title is still default "New Chat"
            if ("New Chat".equals(c.getTitle()) && content != null && !content.isBlank()) {
                String autoTitle = content.length() > 40 ? content.substring(0, 37) + "..." : content;
                c.setTitle(autoTitle.trim());
            }
            c.setUpdatedAt(Instant.now());
            conversationRepository.save(c);
        });

        return saved;
    }

    public ChatMessage saveAssistantMessage(
            String conversationId,
            String userId,
            String content,
            String voiceScript,
            String provider,
            List<String> toolsUsed
    ) {
        ChatMessage message = new ChatMessage(
                conversationId,
                userId,
                "assistant",
                content,
                voiceScript,
                provider,
                toolsUsed
        );
        ChatMessage saved = chatMessageRepository.save(message);

        conversationRepository.findByIdAndUserId(conversationId, userId).ifPresent(c -> {
            c.setUpdatedAt(Instant.now());
            conversationRepository.save(c);
        });

        return saved;
    }

    public ChatMessage editMessage(String messageId, String userId, String newContent) {
        ChatMessage message = chatMessageRepository.findByIdAndUserId(messageId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found with id: " + messageId));

        message.setContent(newContent);
        message.setEdited(true);
        message.setEditedAt(Instant.now());

        ChatMessage updated = chatMessageRepository.save(message);
        auditLogService.log(userId, "MESSAGE_EDITED", null, null, "Edited message: " + messageId);
        return updated;
    }

    public void deleteMessage(String messageId, String userId) {
        ChatMessage message = chatMessageRepository.findByIdAndUserId(messageId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found with id: " + messageId));

        chatMessageRepository.delete(message);
        auditLogService.log(userId, "MESSAGE_DELETED", null, null, "Deleted message: " + messageId);
    }
}

