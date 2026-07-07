package com.lvmh.notification.service;

import com.lvmh.notification.event.OrderCreatedEvent;
import com.lvmh.notification.event.PaymentCompletedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from:noreply@lvmh.com}")
    private String fromEmail;

    public void sendOrderConfirmation(OrderCreatedEvent event) {
        String subject = "Order Confirmed — #" + event.getOrderId().toString().substring(0, 8).toUpperCase();
        String body = buildOrderConfirmationEmail(event);
        sendEmail(event.getUserEmail(), subject, body);
    }

    public void sendPaymentReceipt(PaymentCompletedEvent event) {
        String subject = "Payment Receipt — Order #" + event.getOrderId().toString().substring(0, 8).toUpperCase();
        String body = buildPaymentReceiptEmail(event);
        sendEmail(event.getUserEmail(), subject, body);
    }

    public void sendOrderCancellation(OrderCreatedEvent event) {
        String subject = "Order Cancelled — #" + event.getOrderId().toString().substring(0, 8).toUpperCase();
        String body = buildCancellationEmail(event);
        sendEmail(event.getUserEmail(), subject, body);
    }

    public void sendOrderNotificationToAdmin(OrderCreatedEvent event, String adminEmail) {
        String subject = "[NEW ORDER] Order Received — #" + event.getOrderId().toString().substring(0, 8).toUpperCase();
        String body = buildAdminOrderNotificationEmail(event);
        sendEmail(adminEmail, subject, body);
    }

    private void sendEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // true = HTML
            mailSender.send(message);
            log.info("Email sent to {} | Subject: {}", to, subject);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            // Non-blocking — email failure should not affect business flow
        }
    }

    private String buildOrderConfirmationEmail(OrderCreatedEvent event) {
        return """
            <html><body style="font-family: Arial, sans-serif; color: #333;">
              <h2 style="color: #1a1a2e;">✅ Order Confirmed</h2>
              <p>Dear Customer,</p>
              <p>Your order has been successfully placed.</p>
              <table style="border-collapse: collapse; width: 100%%;">
                <tr><td><strong>Order ID:</strong></td><td>%s</td></tr>
                <tr><td><strong>Total:</strong></td><td>$%s</td></tr>
              </table>
              <p>We will notify you once payment is confirmed.</p>
              <p style="color: #888; font-size: 12px;">© 2025 LVMH E-Commerce</p>
            </body></html>
            """.formatted(event.getOrderId(), event.getTotalAmount());
    }

    private String buildPaymentReceiptEmail(PaymentCompletedEvent event) {
        return """
            <html><body style="font-family: Arial, sans-serif; color: #333;">
              <h2 style="color: #1a1a2e;">💳 Payment Received</h2>
              <p>Your payment has been successfully processed.</p>
              <table style="border-collapse: collapse; width: 100%%;">
                <tr><td><strong>Order ID:</strong></td><td>%s</td></tr>
                <tr><td><strong>Payment ID:</strong></td><td>%s</td></tr>
              </table>
              <p>Your order is now being prepared.</p>
              <p style="color: #888; font-size: 12px;">© 2025 LVMH E-Commerce</p>
            </body></html>
            """.formatted(event.getOrderId(), event.getPaymentId());
    }

    private String buildCancellationEmail(OrderCreatedEvent event) {
        return """
            <html><body style="font-family: Arial, sans-serif; color: #333;">
              <h2 style="color: #c0392b;">❌ Order Cancelled</h2>
              <p>Your order has been cancelled.</p>
              <table style="border-collapse: collapse; width: 100%%;">
                <tr><td><strong>Order ID:</strong></td><td>%s</td></tr>
              </table>
              <p>If you were charged, a refund will be processed within 5-7 business days.</p>
              <p style="color: #888; font-size: 12px;">© 2025 LVMH E-Commerce</p>
            </body></html>
            """.formatted(event.getOrderId());
    }

    private String buildAdminOrderNotificationEmail(OrderCreatedEvent event) {
        StringBuilder itemsHtml = new StringBuilder();
        itemsHtml.append("<table style='width: 100%; border-collapse: collapse; margin-top: 15px;'>")
                 .append("<tr style='background-color: #faf9f6; text-align: left;'>")
                 .append("<th style='padding: 10px; border-bottom: 1px solid #e5e5e0;'>Product</th>")
                 .append("<th style='padding: 10px; border-bottom: 1px solid #e5e5e0;'>Qty</th>")
                 .append("<th style='padding: 10px; border-bottom: 1px solid #e5e5e0;'>Price</th>")
                 .append("</tr>");
        if (event.getItems() != null) {
            for (var item : event.getItems()) {
                itemsHtml.append("<tr>")
                         .append("<td style='padding: 10px; border-bottom: 1px solid #e5e5e0;'>").append(item.getProductName()).append("</td>")
                         .append("<td style='padding: 10px; border-bottom: 1px solid #e5e5e0;'>").append(item.getQuantity()).append("</td>")
                         .append("<td style='padding: 10px; border-bottom: 1px solid #e5e5e0;'>$").append(item.getUnitPrice()).append("</td>")
                         .append("</tr>");
            }
        }
        itemsHtml.append("</table>");

        return """
            <html>
            <body style="font-family: 'Outfit', 'Inter', 'Helvetica Neue', Arial, sans-serif; background-color: #faf9f6; color: #1a1a1a; margin: 0; padding: 20px;">
              <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border: 1px solid #e5e5e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <tr>
                  <td style="background-color: #1a1a1a; padding: 30px 20px; text-align: center; border-bottom: 2px solid #d4af37;">
                    <h1 style="color: #ffffff; font-family: 'Playfair Display', serif; margin: 0; font-size: 24px; letter-spacing: 2px; text-transform: uppercase;">LVMH Maison</h1>
                    <p style="color: #d4af37; font-size: 11px; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 3px;">New Order Received</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px;">
                    <h2 style="color: #1a1a1a; font-size: 18px; font-weight: 600; margin-top: 0; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px;">Order Notification</h2>
                    <p style="font-size: 14px; line-height: 1.6; color: #4a4a4a;">
                      A client has placed a new order. Details are listed below.
                    </p>
                    
                    <div style="background-color: #faf9f6; padding: 15px; border-radius: 4px; margin-bottom: 20px; font-size: 14px;">
                      <strong>Order ID:</strong> %s<br/>
                      <strong>Client Email:</strong> %s<br/>
                      <strong>Total Amount:</strong> $%s
                    </div>
                    
                    <h3 style="margin-top: 20px; color: #1a1a1a; font-size: 16px; border-bottom: 1px solid #1a1a1a; padding-bottom: 5px; text-transform: uppercase;">Order Items</h3>
                    %s
                    
                    <h3 style="margin-top: 20px; color: #1a1a1a; font-size: 16px; border-bottom: 1px solid #1a1a1a; padding-bottom: 5px; text-transform: uppercase;">Delivery Address</h3>
                    <div style="background-color: #faf9f6; padding: 15px; border-radius: 4px; font-size: 14px; line-height: 1.5; margin-top: 10px;">
                      %s<br/>
                      %s, %s<br/>
                      Postal Code: %s
                    </div>
                    
                    %s
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #faf9f6; padding: 20px; text-align: center; border-top: 1px solid #e5e5e0; color: #888888; font-size: 11px;">
                    <p style="margin: 0;">© 2026 LVMH E-Commerce. Admin Internal Notification.</p>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(
                event.getOrderId(),
                event.getUserEmail(),
                event.getTotalAmount(),
                itemsHtml.toString(),
                event.getShippingStreet(),
                event.getShippingCity(),
                event.getShippingCountry(),
                event.getShippingPostalCode(),
                (event.getNotes() != null && !event.getNotes().isBlank()) ? "<p style='margin-top: 15px; font-size: 14px;'><strong>Notes:</strong> " + event.getNotes() + "</p>" : ""
            );
    }

    public void sendProductAnnouncement(String emailAddress, com.lvmh.notification.event.ProductCreatedEvent event) {
        String subject = "New Arrival: " + event.getName() + " by " + event.getBrand();
        String body = buildProductAnnouncementEmail(event);
        sendEmail(emailAddress, subject, body);
    }

    private String buildProductAnnouncementEmail(com.lvmh.notification.event.ProductCreatedEvent event) {
        String imageHtml = "";
        if (event.getImageUrl() != null && !event.getImageUrl().isBlank()) {
            imageHtml = "<div style='text-align: center; margin: 20px 0;'><img src='" + event.getImageUrl() + "' alt='" + event.getName() + "' style='max-width: 100%; max-height: 300px; border-radius: 8px;' /></div>";
        }
        return """
            <html>
            <body style="font-family: 'Outfit', 'Inter', 'Helvetica Neue', Arial, sans-serif; background-color: #faf9f6; color: #1a1a1a; margin: 0; padding: 20px;">
              <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border: 1px solid #e5e5e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <tr>
                  <td style="background-color: #1a1a1a; padding: 40px 20px; text-align: center; border-bottom: 2px solid #d4af37;">
                    <h1 style="color: #ffffff; font-family: 'Playfair Display', serif; margin: 0; font-size: 28px; letter-spacing: 2px; text-transform: uppercase;">LVMH Maison</h1>
                    <p style="color: #d4af37; font-size: 12px; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 3px;">Exclusive Announcement</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1a1a1a; font-size: 22px; font-weight: 600; margin-top: 0; margin-bottom: 20px; text-align: center; text-transform: uppercase; letter-spacing: 1px;">Discover a New Masterpiece</h2>
                    <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; text-align: center; margin-bottom: 30px;">
                      We are thrilled to present our latest creation, reflecting the pinnacle of luxury, heritage, and craftsmanship.
                    </p>
                    
                    %s
                    
                    <div style="background-color: #faf9f6; border-left: 4px solid #1a1a1a; padding: 20px; margin: 30px 0; border-radius: 4px;">
                      <h3 style="margin-top: 0; color: #1a1a1a; font-size: 18px; text-transform: uppercase; letter-spacing: 0.5px;">%s</h3>
                      <p style="color: #d4af37; font-weight: bold; font-size: 20px; margin: 10px 0;">$%s</p>
                      <p style="color: #555555; font-size: 14px; line-height: 1.5; margin: 10px 0 0 0;">%s</p>
                      <p style="color: #888888; font-size: 12px; margin: 15px 0 0 0;">SKU: %s | Brand: %s</p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px;">
                      <a href="http://localhost:5173" style="background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 15px 30px; font-size: 14px; font-weight: bold; border-radius: 4px; display: inline-block; text-transform: uppercase; letter-spacing: 1px;">Explore Collection</a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #faf9f6; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e5e0; color: #888888; font-size: 12px;">
                    <p style="margin: 0 0 10px 0;">You are receiving this because you are a registered client of LVMH Maison.</p>
                    <p style="margin: 0;">© 2026 LVMH E-Commerce. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(imageHtml, event.getName(), event.getPrice(), event.getDescription(), event.getSku(), event.getBrand());
    }
}

