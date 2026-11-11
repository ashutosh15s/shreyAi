package com.shreyai.service;

import com.shreyai.dto.UpdateProfileRequest;
import com.shreyai.dto.UserProfileResponse;
import com.shreyai.exception.ResourceNotFoundException;
import com.shreyai.model.Role;
import com.shreyai.model.User;
import com.shreyai.repository.SessionRepository;
import com.shreyai.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final TokenBlacklistService tokenBlacklistService;
    private final AuditLogService auditLogService;

    public UserService(
            UserRepository userRepository,
            SessionRepository sessionRepository,
            TokenBlacklistService tokenBlacklistService,
            AuditLogService auditLogService
    ) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.tokenBlacklistService = tokenBlacklistService;
        this.auditLogService = auditLogService;
    }

    public Page<UserProfileResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::mapToProfile);
    }

    public UserProfileResponse getUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return mapToProfile(user);
    }

    public UserProfileResponse updateUserRole(String id, Role newRole, String adminUserId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setRole(newRole);
        User saved = userRepository.save(user);

        auditLogService.log(adminUserId, "USER_ROLE_UPDATED", null, null,
                "Updated role of user " + user.getEmail() + " to " + newRole);

        return mapToProfile(saved);
    }

    public UserProfileResponse updateUser(String id, UpdateProfileRequest request, String adminUserId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setName(request.getName().trim());
        user.setUpdatedAt(Instant.now());
        User saved = userRepository.save(user);

        auditLogService.log(adminUserId, "USER_UPDATED", null, null,
                "Updated details for user " + user.getEmail());

        return mapToProfile(saved);
    }

    public UserProfileResponse setUserBlacklisted(String id, boolean blacklisted, String adminUserId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setBlacklisted(blacklisted);
        user.setUpdatedAt(Instant.now());
        User saved = userRepository.save(user);

        if (blacklisted) {
            // Revoke all sessions and blacklist all tokens for this user
            sessionRepository.findByUserIdAndRevokedFalse(id).forEach(session -> {
                session.setRevoked(true);
                sessionRepository.save(session);
                tokenBlacklistService.blacklist(session.getToken(), id, session.getExpiresAt());
            });
        }

        auditLogService.log(adminUserId, blacklisted ? "USER_BLACKLISTED" : "USER_UNBLACKLISTED", null, null,
                (blacklisted ? "Blacklisted" : "Unblacklisted") + " user: " + user.getEmail());

        return mapToProfile(saved);
    }

    public void deleteUser(String id, String adminUserId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        // Revoke active sessions
        sessionRepository.findByUserIdAndRevokedFalse(id).forEach(session -> {
            session.setRevoked(true);
            sessionRepository.save(session);
            tokenBlacklistService.blacklist(session.getToken(), id, session.getExpiresAt());
        });

        userRepository.delete(user);
        auditLogService.log(adminUserId, "USER_DELETED", null, null,
                "Deleted user with id " + id + " (" + user.getEmail() + ")");
    }

    private UserProfileResponse mapToProfile(User user) {
        return new UserProfileResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.isEnabled(),
                user.isBlacklisted(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
