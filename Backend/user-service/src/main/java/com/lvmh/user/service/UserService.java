package com.lvmh.user.service;

import com.lvmh.user.dto.AddressRequest;
import com.lvmh.user.dto.AddressResponse;
import com.lvmh.user.dto.UpdateProfileRequest;
import com.lvmh.user.dto.UserProfileResponse;
import com.lvmh.user.model.Address;
import com.lvmh.user.model.UserProfile;
import com.lvmh.user.repository.AddressRepository;
import com.lvmh.user.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserProfileRepository profileRepository;
    private final AddressRepository addressRepository;

    /**
     * Get or create profile for a user. Called on first access.
     */
    @Transactional
    public UserProfileResponse getOrCreateProfile(UUID authUserId, String email,
                                                   String firstName, String lastName) {
        UserProfile profile = profileRepository.findByAuthUserId(authUserId)
                .orElseGet(() -> {
                    log.info("Creating profile for new user: {}", authUserId);
                    return profileRepository.save(UserProfile.builder()
                            .authUserId(authUserId)
                            .email(email)
                            .firstName(firstName)
                            .lastName(lastName)
                            .build());
                });
        return mapToResponse(profile);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(UUID authUserId) {
        UserProfile profile = getProfileOrThrow(authUserId);
        return mapToResponse(profile);
    }

    @Transactional
    public UserProfileResponse updateProfile(UUID authUserId, UpdateProfileRequest request) {
        UserProfile profile = getProfileOrThrow(authUserId);
        if (request.getFirstName() != null) profile.setFirstName(request.getFirstName());
        if (request.getLastName() != null) profile.setLastName(request.getLastName());
        if (request.getPhone() != null) profile.setPhone(request.getPhone());
        if (request.getAvatarUrl() != null) profile.setAvatarUrl(request.getAvatarUrl());
        if (request.getDateOfBirth() != null) profile.setDateOfBirth(request.getDateOfBirth());
        return mapToResponse(profileRepository.save(profile));
    }

    @Transactional(readOnly = true)
    public List<AddressResponse> getAddresses(UUID authUserId) {
        UserProfile profile = getProfileOrThrow(authUserId);
        return profile.getAddresses().stream().map(this::mapAddressToResponse).collect(Collectors.toList());
    }

    @Transactional
    public AddressResponse addAddress(UUID authUserId, AddressRequest request) {
        UserProfile profile = getProfileOrThrow(authUserId);
        Address address = Address.builder()
                .userProfile(profile)
                .label(request.getLabel())
                .street(request.getStreet())
                .city(request.getCity())
                .state(request.getState())
                .country(request.getCountry())
                .postalCode(request.getPostalCode())
                .isDefault(request.isDefault())
                .build();
        return mapAddressToResponse(addressRepository.save(address));
    }

    @Transactional
    public void deleteAddress(UUID authUserId, UUID addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new IllegalArgumentException("Address not found"));
        if (!address.getUserProfile().getAuthUserId().equals(authUserId)) {
            throw new IllegalArgumentException("Address does not belong to this user");
        }
        addressRepository.delete(address);
    }

    private UserProfile getProfileOrThrow(UUID authUserId) {
        return profileRepository.findByAuthUserId(authUserId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found for user: " + authUserId));
    }

    private UserProfileResponse mapToResponse(UserProfile p) {
        return UserProfileResponse.builder()
                .id(p.getId())
                .authUserId(p.getAuthUserId())
                .firstName(p.getFirstName())
                .lastName(p.getLastName())
                .email(p.getEmail())
                .phone(p.getPhone())
                .avatarUrl(p.getAvatarUrl())
                .dateOfBirth(p.getDateOfBirth())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private AddressResponse mapAddressToResponse(Address a) {
        return AddressResponse.builder()
                .id(a.getId())
                .label(a.getLabel())
                .street(a.getStreet())
                .city(a.getCity())
                .state(a.getState())
                .country(a.getCountry())
                .postalCode(a.getPostalCode())
                .isDefault(a.isDefault())
                .build();
    }
}
