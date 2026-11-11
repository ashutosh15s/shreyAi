package com.shreyai.dto;

import jakarta.validation.constraints.NotBlank;

public class EditMessageRequest {

    @NotBlank(message = "Message content cannot be blank")
    private String content;

    public EditMessageRequest() {
    }

    public EditMessageRequest(String content) {
        this.content = content;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}

