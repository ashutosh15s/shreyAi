package com.shreyai.service;

import com.shreyai.dto.*;
import com.shreyai.exception.InvalidTokenException;
import com.shreyai.exception.ResourceNotFoundException;
import com.shreyai.exception.UserAlreadyExistsException;
import com.shreyai.model.Role;
import com.shreyai.model.Session;
import com.shreyai.model.User;
import com.shreyai.repository.SessionRepository;
import com.shreyai.repository.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditLogService auditLogService;
    private final RateLimitService rateLimitService;

    public AuthService(
            UserRepository userRepository,
            SessionRepository sessionRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuditLogService auditLogService,
            RateLimitService rateLimitService
    ) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.auditLogService = auditLogService;
        this.rateLimitService = rateLimitService;
    }

    public AuthResponse register(RegisterRequest request, String clientIp) {
        rateLimitService.checkAuthRateLimit(clientIp);

        String normalizedEmail = request.getEmail().toLowerCase().trim();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new UserAlreadyExistsException("A user with email " + normalizedEmail + " already exists");
        }

        // The first registered user can be an ADMIN if needed, otherwise standard USER
        boolean isFirstUser = userRepository.count() == 0;
        Role assignedRole = isFirstUser ? Role.ROLE_ADMIN : Role.ROLE_USER;

        String encodedPassword = passwordEncoder.encode(request.getPassword());
        User user = new User(request.getName().trim(), normalizedEmail, encodedPassword, assignedRole);
        user = userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(user.getId());

        saveSession(user.getId(), refreshToken, jwtService.getRefreshExpirationMs());
        auditLogService.log(user.getId(), "USER_REGISTER", null, null, "User registered successfully");

        return new AuthResponse(
                accessToken,
                refreshToken,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                jwtService.getExpirationMs()
        );
    }

    public AuthResponse login(AuthRequest request, String clientIp) {
        rateLimitService.checkAuthRateLimit(clientIp);

        String normalizedEmail = request.getEmail().toLowerCase().trim();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!user.isEnabled()) {
            throw new BadCredentialsException("User account is disabled");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(user.getId());

        saveSession(user.getId(), refreshToken, jwtService.getRefreshExpirationMs());
        auditLogService.log(user.getId(), "USER_LOGIN", null, null, "User logged in from " + clientIp);

        return new AuthResponse(
                accessToken,
                refreshToken,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                jwtService.getExpirationMs()
        );
    }

    public AuthResponse refreshAccessToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();

        if (!jwtService.isTokenValid(refreshToken)) {
            throw new InvalidTokenException("Invalid or expired refresh token");
        }

        Session session = sessionRepository.findByToken(refreshToken)
                .orElseThrow(() -> new InvalidTokenException("Session not found or revoked"));

        if (session.isRevoked() || session.getExpiresAt().isBefore(Instant.now())) {
            throw new InvalidTokenException("Refresh token is expired or revoked");
        }

        String userId = session.getUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.isEnabled()) {
            throw new InvalidTokenException("User account is disabled");
        }

        // Rotate tokens
        String newAccessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String newRefreshToken = jwtService.generateRefreshToken(user.getId());

        session.setRevoked(true);
        sessionRepository.save(session);
        saveSession(user.getId(), newRefreshToken, jwtService.getRefreshExpirationMs());

        auditLogService.log(user.getId(), "TOKEN_REFRESH", null, null, "Token refreshed successfully");

        return new AuthResponse(
                newAccessToken,
                newRefreshToken,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                jwtService.getExpirationMs()
        );
    }

    public void logout(String refreshToken, String userId) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            Optional<Session> sessionOpt = sessionRepository.findByToken(refreshToken);
            sessionOpt.ifPresent(session -> {
                session.setRevoked(true);
                sessionRepository.save(session);
            });
        }
        auditLogService.log(userId, "USER_LOGOUT", null, null, "User logged out");
    }

    public UserProfileResponse getProfile(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

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

    public UserProfileResponse updateProfile(String userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setName(request.getName().trim());
        user.setUpdatedAt(Instant.now());
        User updated = userRepository.save(user);

        auditLogService.log(userId, "PROFILE_UPDATED", null, null, "User updated profile name");

        return new UserProfileResponse(
                updated.getId(),
                updated.getName(),
                updated.getEmail(),
                updated.getRole(),
                updated.isEnabled(),
                updated.getCreatedAt(),
                updated.getUpdatedAt()
        );
    }

    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Current password does not match");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        // Revoke all existing sessions on password change for security
        sessionRepository.findByUserIdAndRevokedFalse(userId).forEach(session -> {
            session.setRevoked(true);
            sessionRepository.save(session);
        });

        auditLogService.log(userId, "PASSWORD_CHANGED", null, null, "User changed account password");
    }

    private void saveSession(String userId, String token, long expirationMs) {
        Instant expiresAt = Instant.now().plusMillis(expirationMs);
        Session session = new Session(userId, token, expiresAt);
        sessionRepository.save(session);
    }
}
