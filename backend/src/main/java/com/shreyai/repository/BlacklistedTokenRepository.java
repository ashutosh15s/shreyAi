package com.shreyai.repository;

import com.shreyai.model.BlacklistedToken;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface BlacklistedTokenRepository extends MongoRepository<BlacklistedToken, String> {

    boolean existsByToken(String token);

    Optional<BlacklistedToken> findByToken(String token);

    void deleteByExpiresAtBefore(Instant now);
}
