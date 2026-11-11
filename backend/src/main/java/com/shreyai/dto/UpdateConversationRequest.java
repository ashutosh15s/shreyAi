package com.shreyai.dto;

public class UpdateConversationRequest {

    private String title;
    private Boolean isPinned;

    public UpdateConversationRequest() {
    }

    public UpdateConversationRequest(String title) {
        this.title = title;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Boolean getIsPinned() {
        return isPinned;
    }

    public void setIsPinned(Boolean isPinned) {
        this.isPinned = isPinned;
    }
}

