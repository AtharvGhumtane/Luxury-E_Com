package com.lvmh.notification.controller;

import com.lvmh.notification.event.ProductCreatedEvent;
import com.lvmh.notification.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final EmailService emailService;
    private final RestTemplate restTemplate;

    @PostMapping("/new-product")
    public ResponseEntity<Void> notifyNewProduct(@RequestBody ProductCreatedEvent event) {
        log.info("Received new product notification request for: {}", event.getName());
        try {
            // Fetch all registered user emails from auth-service
            String[] emailsArray = restTemplate.getForObject("http://auth-service/api/auth/emails", String[].class);
            if (emailsArray != null && emailsArray.length > 0) {
                List<String> emails = Arrays.asList(emailsArray);
                log.info("Fetched {} user emails for product announcement", emails.size());
                
                // Dispatch announcement email to each user asynchronously/sequentially
                for (String email : emails) {
                    try {
                        emailService.sendProductAnnouncement(email, event);
                    } catch (Exception ex) {
                        log.error("Failed to send product announcement to {}: {}", email, ex.getMessage());
                    }
                }
            } else {
                log.warn("No user emails returned from auth-service, skipping notifications.");
            }
        } catch (Exception e) {
            log.error("Error communicating with auth-service or sending notifications: {}", e.getMessage(), e);
        }
        return ResponseEntity.ok().build();
    }
}
