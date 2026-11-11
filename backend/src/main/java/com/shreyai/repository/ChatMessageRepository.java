package com.shreyai.repository;

import com.shreyai.model.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {

    List<ChatMessage> findByConversationIdAndUserIdOrderByTimestampAsc(String conversationId, String userId);

    List<ChatMessage> findTop10ByConversationIdAndUserIdOrderByTimestampDesc(String conversationId, String userId);

    Optional<ChatMessage> findByIdAndUserId(String id, String userId);

    void deleteByConversationIdAndUserId(String conversationId, String userId);

    void deleteByIdAndUserId(String id, String userId);

    long countByConversationIdAndUserId(String conversationId, String userId);
}

