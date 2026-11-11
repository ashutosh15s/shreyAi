package com.shreyai.service;

import com.shreyai.exception.RateLimitExceededException;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitService {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Value("${rate-limit.groq.capacity:60}")
    private long groqCapacity;

    @Value("${rate-limit.grok.capacity:20}")
    private long grokCapacity;

    @Value("${rate-limit.gemini.capacity:100}")
    private long geminiCapacity;

    @Value("${rate-limit.openrouter.capacity:100}")
    private long openrouterCapacity;

    @Value("${rate-limit.default.capacity:60}")
    private long defaultCapacity;

    public void checkRateLimit(String userId, String provider) {
        String cleanProvider = (provider == null || provider.isBlank()) ? "default" : provider.toLowerCase().trim();
        String key = userId + ":" + cleanProvider;

        Bucket bucket = buckets.computeIfAbsent(key, k -> createBucketForProvider(cleanProvider));
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

        if (!probe.isConsumed()) {
            long waitForRefillNanos = probe.getNanosToWaitForRefill();
            long retryAfterSeconds = Math.max(1, (waitForRefillNanos / 1_000_000_000L) + 1);
            throw new RateLimitExceededException(
                    "Rate limit exceeded for provider '" + cleanProvider + "'. Please try again in " + retryAfterSeconds + " seconds.",
                    retryAfterSeconds
            );
        }
    }

    public void checkAuthRateLimit(String clientIdentifier) {
        String key = "auth:" + clientIdentifier;
        Bucket bucket = buckets.computeIfAbsent(key, k -> Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(15)
                        .refillGreedy(15, Duration.ofMinutes(1))
                        .build())
                .build());

        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (!probe.isConsumed()) {
            long retryAfterSeconds = Math.max(1, (probe.getNanosToWaitForRefill() / 1_000_000_000L) + 1);
            throw new RateLimitExceededException(
                    "Too many authentication attempts. Please try again in " + retryAfterSeconds + " seconds.",
                    retryAfterSeconds
            );
        }
    }

    private Bucket createBucketForProvider(String provider) {
        long capacity = switch (provider) {
            case "groq" -> groqCapacity;
            case "grok" -> grokCapacity;
            case "gemini" -> geminiCapacity;
            case "openrouter" -> openrouterCapacity;
            default -> defaultCapacity;
        };

        Bandwidth limit = Bandwidth.builder()
                .capacity(capacity)
                .refillGreedy(capacity, Duration.ofMinutes(1))
                .build();

        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
}

