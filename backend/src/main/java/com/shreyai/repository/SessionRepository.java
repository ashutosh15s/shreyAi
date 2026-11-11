package com.shreyai.repository;

import com.shreyai.model.Session;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface SessionRepository extends MongoRepository<Session, String> {

    Optional<Session> findByToken(String token);

    List<Session> findByUserIdAndRevokedFalse(String userId);

    void deleteByExpiresAtBefore(Instant now);

    void deleteByUserId(String userId);
}
