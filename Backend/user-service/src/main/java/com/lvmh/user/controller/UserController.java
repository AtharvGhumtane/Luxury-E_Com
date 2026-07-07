package com.lvmh.user.controller;

import com.lvmh.user.dto.*;
import com.lvmh.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User profile and address management")
public class UserController {

    private final UserService userService;

    /**
     * Extracts the authUserId from the gateway-injected X-User-Id header
     * (available as Authentication.details via HeaderAuthenticationFilter).
     */
    private UUID extractUserId(Authentication auth) {
        return UUID.fromString((String) auth.getDetails());
    }

    @GetMapping("/me")
    @Operation(summary = "Get own profile")
    public ResponseEntity<UserProfileResponse> getProfile(Authentication auth,
                                                           @RequestHeader("X-User-Email") String email,
                                                           @RequestHeader(value = "X-User-Id") String userIdStr,
                                                           @RequestHeader(value = "X-User-Role", required = false, defaultValue = "ROLE_USER") String role) {
        UUID userId = UUID.fromString(userIdStr);
        // Lazy profile creation — ensures profile exists on first access
        String[] nameParts = auth.getName().split("@")[0].split("\\.");
        String firstName = nameParts.length > 0 ? nameParts[0] : "User";
        String lastName = nameParts.length > 1 ? nameParts[1] : "";
        return ResponseEntity.ok(userService.getOrCreateProfile(userId, email, firstName, lastName));
    }

    @PutMapping("/me")
    @Operation(summary = "Update own profile")
    public ResponseEntity<UserProfileResponse> updateProfile(Authentication auth,
                                                              @RequestHeader("X-User-Id") String userIdStr,
                                                              @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(UUID.fromString(userIdStr), request));
    }

    @GetMapping("/me/addresses")
    @Operation(summary = "List own addresses")
    public ResponseEntity<List<AddressResponse>> getAddresses(@RequestHeader("X-User-Id") String userIdStr) {
        return ResponseEntity.ok(userService.getAddresses(UUID.fromString(userIdStr)));
    }

    @PostMapping("/me/addresses")
    @Operation(summary = "Add a new address")
    public ResponseEntity<AddressResponse> addAddress(@RequestHeader("X-User-Id") String userIdStr,
                                                       @Valid @RequestBody AddressRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(userService.addAddress(UUID.fromString(userIdStr), request));
    }

    @DeleteMapping("/me/addresses/{addressId}")
    @Operation(summary = "Delete an address")
    public ResponseEntity<Void> deleteAddress(@RequestHeader("X-User-Id") String userIdStr,
                                               @PathVariable UUID addressId) {
        userService.deleteAddress(UUID.fromString(userIdStr), addressId);
        return ResponseEntity.noContent().build();
    }
}
