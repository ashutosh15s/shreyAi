package com.shreyai.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "rate_limits")
@CompoundIndex(name = "user_provider_idx", def = "{'userId': 1, 'provider': 1}")
public class RateLimitRecord {

    @Id
    private String id;

    private String userId;

    private String provider;

    private long requestCount;

    private Instant windowStart;

    public RateLimitRecord() {
    }

    public RateLimitRecord(String userId, String provider, long requestCount, Instant windowStart) {
        this.userId = userId;
        this.provider = provider;
        this.requestCount = requestCount;
        this.windowStart = windowStart;
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

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public long getRequestCount() {
        return requestCount;
    }

    public void setRequestCount(long requestCount) {
        this.requestCount = requestCount;
    }

    public Instant getWindowStart() {
        return windowStart;
    }

    public void setWindowStart(Instant windowStart) {
        this.windowStart = windowStart;
    }
}

