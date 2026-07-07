package com.lvmh.order.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PlaceOrderRequest {
    @NotBlank private String shippingStreet;
    @NotBlank private String shippingCity;
    @NotBlank private String shippingCountry;
    @NotBlank private String shippingPostalCode;
    private String notes;
}
