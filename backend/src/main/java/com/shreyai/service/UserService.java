package com.shreyai.service;

import com.shreyai.dto.UserProfileResponse;
import com.shreyai.exception.ResourceNotFoundException;
import com.shreyai.model.Role;
import com.shreyai.model.User;
import com.shreyai.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public UserService(UserRepository userRepository, AuditLogService auditLogService) {
        this.userRepository = userRepository;
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

    public void deleteUser(String id, String adminUserId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

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
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}

