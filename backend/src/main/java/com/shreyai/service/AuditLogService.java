package com.shreyai.service;

import com.shreyai.model.AuditLog;
import com.shreyai.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(String userId, String action, String provider, String model, String details) {
        AuditLog log = new AuditLog(userId, action, provider, model, details);
        auditLogRepository.save(log);
    }

    public List<AuditLog> getUserLogs(String userId) {
        return auditLogRepository.findByUserIdOrderByTimestampDesc(userId);
    }

    public Page<AuditLog> getUserLogsPaged(String userId, Pageable pageable) {
        return auditLogRepository.findByUserIdOrderByTimestampDesc(userId, pageable);
    }

    public Page<AuditLog> getAllLogsPaged(Pageable pageable) {
        return auditLogRepository.findAllByOrderByTimestampDesc(pageable);
    }
}
