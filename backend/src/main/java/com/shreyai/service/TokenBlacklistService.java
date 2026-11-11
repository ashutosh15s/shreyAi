package com.shreyai.service;

import com.shreyai.model.BlacklistedToken;
import com.shreyai.repository.BlacklistedTokenRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class TokenBlacklistService {

    private final BlacklistedTokenRepository blacklistedTokenRepository;

    public TokenBlacklistService(BlacklistedTokenRepository blacklistedTokenRepository) {
        this.blacklistedTokenRepository = blacklistedTokenRepository;
    }

    public void blacklist(String token, String userId, Instant expiresAt) {
        if (token == null || token.isBlank()) {
            return;
        }
        if (!blacklistedTokenRepository.existsByToken(token)) {
            BlacklistedToken blacklistedToken = new BlacklistedToken(token, userId, expiresAt);
            blacklistedTokenRepository.save(blacklistedToken);
        }
    }

    public boolean isBlacklisted(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        return blacklistedTokenRepository.existsByToken(token);
    }
}

