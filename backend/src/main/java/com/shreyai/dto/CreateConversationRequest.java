package com.shreyai.dto;

public class CreateConversationRequest {

    private String title;
    private String modelProvider = "groq";

    public CreateConversationRequest() {
    }

    public CreateConversationRequest(String title, String modelProvider) {
        this.title = title;
        this.modelProvider = modelProvider != null ? modelProvider : "groq";
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getModelProvider() {
        return modelProvider;
    }

    public void setModelProvider(String modelProvider) {
        this.modelProvider = modelProvider;
    }
}

