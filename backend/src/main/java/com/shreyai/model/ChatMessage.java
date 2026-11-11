package com.shreyai.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "chat_messages")
public class ChatMessage {

    @Id
    private String id;

    @Indexed
    private String conversationId;

    @Indexed
    private String userId;

    private String role; // "user" or "assistant"

    private String content;

    private String voiceScript;

    private String provider;

    private List<String> toolsUsed = new ArrayList<>();

    private boolean isEdited = false;

    private Instant timestamp;

    private Instant editedAt;

    public ChatMessage() {
        this.timestamp = Instant.now();
    }

    public ChatMessage(String conversationId, String userId, String role, String content) {
        this.conversationId = conversationId;
        this.userId = userId;
        this.role = role;
        this.content = content;
        this.timestamp = Instant.now();
        this.isEdited = false;
    }

    public ChatMessage(String conversationId, String userId, String role, String content, String voiceScript, String provider, List<String> toolsUsed) {
        this.conversationId = conversationId;
        this.userId = userId;
        this.role = role;
        this.content = content;
        this.voiceScript = voiceScript;
        this.provider = provider;
        this.toolsUsed = toolsUsed != null ? toolsUsed : new ArrayList<>();
        this.timestamp = Instant.now();
        this.isEdited = false;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getConversationId() {
        return conversationId;
    }

    public void setConversationId(String conversationId) {
        this.conversationId = conversationId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getVoiceScript() {
        return voiceScript;
    }

    public void setVoiceScript(String voiceScript) {
        this.voiceScript = voiceScript;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public List<String> getToolsUsed() {
        return toolsUsed;
    }

    public void setToolsUsed(List<String> toolsUsed) {
        this.toolsUsed = toolsUsed;
    }

    public boolean isEdited() {
        return isEdited;
    }

    public void setEdited(boolean edited) {
        isEdited = edited;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public Instant getEditedAt() {
        return editedAt;
    }

    public void setEditedAt(Instant editedAt) {
        this.editedAt = editedAt;
    }
}

