package com.lvmh.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressResponse {
    private UUID id;
    private String label;
    private String street;
    private String city;
    private String state;
    private String country;
    private String postalCode;
    private boolean isDefault;
}
