package com.shreyai.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "conversations")
public class Conversation {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String title;

    private boolean isPinned = false;

    private String modelProvider = "groq";

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public Conversation() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public Conversation(String userId, String title) {
        this.userId = userId;
        this.title = title != null && !title.isBlank() ? title : "New Chat";
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        this.isPinned = false;
    }

    public Conversation(String userId, String title, String modelProvider) {
        this.userId = userId;
        this.title = title != null && !title.isBlank() ? title : "New Chat";
        this.modelProvider = modelProvider != null ? modelProvider : "groq";
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        this.isPinned = false;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public boolean isPinned() {
        return isPinned;
    }

    public void setPinned(boolean pinned) {
        isPinned = pinned;
    }

    public String getModelProvider() {
        return modelProvider;
    }

    public void setModelProvider(String modelProvider) {
        this.modelProvider = modelProvider;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}

