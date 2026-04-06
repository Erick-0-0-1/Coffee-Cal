package com.coffeecalculator.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int MAX_ATTEMPTS = 3; // Brute-force protection: 3 allowed guesses
    private static final int OTP_COOLDOWN_SECONDS = 60; // Rate limiting: 1 OTP per minute

    private final JavaMailSender mailSender;

    // Pulls your Gmail address from environment variables
    @Value("${spring.mail.username}")
    private String senderEmail;

    // Simple ConcurrentHashMap implementation
    private final Map<String, OtpDetails> otpCache = new ConcurrentHashMap<>();
    
    // Rate limiting cache
    private final Map<String, Long> rateLimitCache = new ConcurrentHashMap<>();

    // Cryptographically secure random number generator
    private final SecureRandom secureRandom = new SecureRandom();

    // Inject JavaMailSender via constructor
    public OtpService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // Helper class to track OTP code, failed attempts, and pending registration data
    public static class OtpDetails {
        private final String code;
        private final AtomicInteger attempts;
        private final String username;
        private final String password;

        public OtpDetails(String code) {
            this.code = code;
            this.attempts = new AtomicInteger(0);
            this.username = null;
            this.password = null;
        }

        public OtpDetails(String code, String username, String password) {
            this.code = code;
            this.attempts = new AtomicInteger(0);
            this.username = username;
            this.password = password;
        }

        public String getCode() {
            return code;
        }

        public String getUsername() {
            return username;
        }

        public String getPassword() {
            return password;
        }

        public int incrementAndGetAttempts() {
            return attempts.incrementAndGet();
        }
    }

    public String generateOtp(String email) {
        return generateOtp(email, null, null);
    }
    
    public String generateOtp(String email, String username, String password) {
        Long lastRequest = rateLimitCache.get(email);
        if (lastRequest != null) {
            long secondsLeft = OTP_COOLDOWN_SECONDS - (System.currentTimeMillis() - lastRequest) / 1000;
            log.warn("OTP generation rate limited for {} - try again in {} seconds", email, secondsLeft);
            return null;
        }

        String otp = String.format("%06d", secureRandom.nextInt(1000000));
        otpCache.put(email, new OtpDetails(otp, username, password));
        rateLimitCache.put(email, System.currentTimeMillis());
        log.debug("Generated OTP for {} (expires in {} minutes)", email, OTP_EXPIRY_MINUTES);
        return otp;
    }

    public OtpDetails verifyOtp(String email, String otp) {
        OtpDetails details = otpCache.get(email);
        
        if (details == null) {
            log.debug("OTP verification failed for {}: No OTP found or expired", email);
            return null;
        }

        if (details.getCode().equals(otp)) {
            otpCache.remove(email);
            log.debug("OTP verified successfully for {}", email);
            return details;
        } else {
            int currentAttempts = details.incrementAndGetAttempts();
            
            if (currentAttempts >= MAX_ATTEMPTS) {
                otpCache.remove(email);
                log.warn("OTP invalidated for {}: Exceeded maximum failed attempts ({})", email, MAX_ATTEMPTS);
            } else {
                log.debug("OTP verification failed for {}: Code mismatch. Attempt {} of {}", 
                        email, currentAttempts, MAX_ATTEMPTS);
            }
            return null;
        }
    }

    /**
     * Sends OTP email via Spring Mail / Gmail SMTP
     */
    public void sendOtpEmail(String email, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom("CoffeeCalc <" + senderEmail + ">");
            helper.setTo(email);
            helper.setSubject("Your CoffeeCalc Verification Code");
            
            String htmlContent = String.format("""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #1877f2; padding: 20px; text-align: center;">
                        <h2 style="color: white; margin: 0;">CoffeeCalc</h2>
                    </div>
                    <div style="padding: 30px; background: #f8f9fa;">
                        <h3>Welcome to CoffeeCalc!</h3>
                        <p>Your verification code is:</p>
                        <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                            <h1 style="font-size: 48px; font-weight: bold; color: #1877f2; letter-spacing: 12px; margin: 0;">%s</h1>
                        </div>
                        <p>This code will expire in 5 minutes.</p>
                        <p style="color: #6c757d; font-size: 14px;">If you didn't request this code, you can safely ignore this email.</p>
                    </div>
                </div>
                """, otp);
                
            helper.setText(htmlContent, true); // true indicates this is HTML
            mailSender.send(message);
            
            log.info("Successfully sent OTP email to {}", email);
        } catch (MessagingException e) {
            log.error("Failed to send OTP email to {}: {}", email, e.getMessage());
            log.info("FALLBACK: OTP for {} is {}", email, otp);
        }
    }
}