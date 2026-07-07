package com.lvmh.auth.service;

import com.lvmh.auth.dto.AuthResponse;
import com.lvmh.auth.dto.LoginRequest;
import com.lvmh.auth.dto.RegisterRequest;
import com.lvmh.auth.model.RefreshToken;
import com.lvmh.auth.model.Role;
import com.lvmh.auth.model.User;
import com.lvmh.auth.repository.RefreshTokenRepository;
import com.lvmh.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Value("${jwt.refresh-expiration-ms:604800000}")
    private long refreshExpirationMs;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered: " + request.getEmail());
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.ROLE_USER)
                .build();

        userRepository.save(user);
        log.info("New user registered: {}", user.getEmail());

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = createRefreshToken(user);

        return buildAuthResponse(user, accessToken, refreshToken);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Revoke old refresh tokens on re-login (security best practice)
        refreshTokenRepository.revokeAllUserTokens(user);

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = createRefreshToken(user);

        log.info("User logged in: {}", user.getEmail());
        return buildAuthResponse(user, accessToken, refreshToken);
    }

    @Transactional
    public AuthResponse refreshToken(String refreshTokenValue) {
        RefreshToken storedToken = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> new IllegalArgumentException("Refresh token not found"));

        if (storedToken.isRevoked()) {
            // Token reuse detected — revoke all tokens for this user (security measure)
            refreshTokenRepository.revokeAllUserTokens(storedToken.getUser());
            throw new IllegalArgumentException("Refresh token reuse detected. All sessions invalidated.");
        }

        if (storedToken.isExpired()) {
            throw new IllegalArgumentException("Refresh token expired. Please login again.");
        }

        User user = storedToken.getUser();
        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);

        String newAccessToken = jwtService.generateAccessToken(user);
        String newRefreshToken = createRefreshToken(user);

        log.info("Token refreshed for user: {}", user.getEmail());
        return buildAuthResponse(user, newAccessToken, newRefreshToken);
    }

    @Transactional
    public void logout(String refreshTokenValue) {
        refreshTokenRepository.findByToken(refreshTokenValue).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
            log.info("User logged out, token revoked: {}", token.getUser().getEmail());
        });
    }

    private String createRefreshToken(User user) {
        RefreshToken refreshToken = RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .expiryDate(Instant.now().plusMillis(refreshExpirationMs))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);
        return refreshToken.getToken();
    }

    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole().name())
                .build();
    }

    @Transactional(readOnly = true)
    public java.util.List<String> getAllEmails() {
        return userRepository.findAll().stream()
                .map(User::getEmail)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public java.util.List<String> getAdminEmails() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == com.lvmh.auth.model.Role.ROLE_ADMIN)
                .map(User::getEmail)
                .collect(java.util.stream.Collectors.toList());
    }
}
