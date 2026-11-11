package com.shreyai.repository;

import com.shreyai.model.RateLimitRecord;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RateLimitRecordRepository extends MongoRepository<RateLimitRecord, String> {

    Optional<RateLimitRecord> findByUserIdAndProvider(String userId, String provider);
}
