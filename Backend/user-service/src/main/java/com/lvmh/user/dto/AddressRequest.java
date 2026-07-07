package com.lvmh.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddressRequest {
    @NotBlank private String label;
    @NotBlank private String street;
    @NotBlank private String city;
    @NotBlank private String state;
    @NotBlank private String country;
    @NotBlank private String postalCode;
    private boolean isDefault;
}
