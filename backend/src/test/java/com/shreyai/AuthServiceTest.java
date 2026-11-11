package com.shreyai;

import com.shreyai.dto.AuthRequest;
import com.shreyai.dto.AuthResponse;
import com.shreyai.dto.RegisterRequest;
import com.shreyai.exception.UserAlreadyExistsException;
import com.shreyai.model.Role;
import com.shreyai.model.User;
import com.shreyai.repository.SessionRepository;
import com.shreyai.repository.UserRepository;
import com.shreyai.service.AuditLogService;
import com.shreyai.service.AuthService;
import com.shreyai.service.JwtService;
import com.shreyai.service.RateLimitService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SessionRepository sessionRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private RateLimitService rateLimitService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository,
                sessionRepository,
                passwordEncoder,
                jwtService,
                auditLogService,
                rateLimitService
        );
    }

    @Test
    void register_Success() {
        RegisterRequest request = new RegisterRequest("Test User", "test@example.com", "password123");

        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(userRepository.count()).thenReturn(0L);
        when(passwordEncoder.encode("password123")).thenReturn("hashedPassword");

        User savedUser = new User("Test User", "test@example.com", "hashedPassword", Role.ROLE_ADMIN);
        savedUser.setId("user123");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        when(jwtService.generateAccessToken("user123", "test@example.com", "ROLE_ADMIN")).thenReturn("mockAccessToken");
        when(jwtService.generateRefreshToken("user123")).thenReturn("mockRefreshToken");
        when(jwtService.getExpirationMs()).thenReturn(86400000L);
        when(jwtService.getRefreshExpirationMs()).thenReturn(604800000L);

        AuthResponse response = authService.register(request, "127.0.0.1");

        assertNotNull(response);
        assertEquals("mockAccessToken", response.getToken());
        assertEquals("test@example.com", response.getEmail());
        assertEquals(Role.ROLE_ADMIN, response.getRole());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void register_DuplicateEmail_ThrowsException() {
        RegisterRequest request = new RegisterRequest("Test User", "test@example.com", "password123");
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        assertThrows(UserAlreadyExistsException.class, () -> authService.register(request, "127.0.0.1"));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void login_InvalidPassword_ThrowsBadCredentials() {
        AuthRequest request = new AuthRequest("test@example.com", "wrongPassword");

        User user = new User("Test User", "test@example.com", "hashedPassword", Role.ROLE_USER);
        user.setId("user123");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongPassword", "hashedPassword")).thenReturn(false);

        assertThrows(BadCredentialsException.class, () -> authService.login(request, "127.0.0.1"));
    }
}

