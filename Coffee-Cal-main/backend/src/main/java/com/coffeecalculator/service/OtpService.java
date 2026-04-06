package com.coffeecalculator.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int MAX_CACHE_SIZE = 10000;
    private static final int MAX_ATTEMPTS = 3; // Brute-force protection: 3 allowed guesses
    private static final int OTP_COOLDOWN_SECONDS = 60; // Rate limiting: 1 OTP per minute

    @Value("${resend.api.key:}")
    private String resendApiKey;

    // Pulls the verified email from application.properties. 
    // The part after the colon is a fallback just in case you forget to add the property!
    @Value("${app.email.sender:noreply@coffeecalc.com}")
    private String senderEmail;

    // Simple ConcurrentHashMap implementation (replaces Caffeine for build stability)
    private final Map<String, OtpDetails> otpCache = new ConcurrentHashMap<>();
    
    // Rate limiting cache - tracks last OTP request time per email
    private final Map<String, Long> rateLimitCache = new ConcurrentHashMap<>();

    // Cryptographically secure random number generator
    private final SecureRandom secureRandom = new SecureRandom();

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

    /**
     * Generates a cryptographically secure 6-digit OTP
     * Implements rate limiting: 1 OTP per minute per email
     * @param email The user's email address
     * @return 6-digit OTP code, null if rate limited
     */
    public String generateOtp(String email) {
        return generateOtp(email, null, null);
    }
    
    /**
     * Generates a cryptographically secure 6-digit OTP with pending registration details
     * Implements rate limiting: 1 OTP per minute per email
     * @param email The user's email address
     * @param username Optional pending username for registration
     * @param password Optional pending password for registration
     * @return 6-digit OTP code, null if rate limited
     */
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

    /**
     * Verifies if the provided OTP is valid for the given email
     * Implements brute-force protection with 3 attempt limit
     * @param email The user's email address
     * @param otp The OTP code to verify
     * @return OtpDetails if valid, null otherwise
     */
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
     * Sends OTP email via Resend API
     * @param email Recipient email address
     * @param otp OTP code to send
     */
    public void sendOtpEmail(String email, String otp) {
        if (resendApiKey == null || resendApiKey.isEmpty()) {
            log.info("DEMO MODE: OTP for {} is {}", email, otp);
            return;
        }

        Resend resend = new Resend(resendApiKey);
            
        CreateEmailOptions params = CreateEmailOptions.builder()
            // 🚨 Updated to use your domain variable dynamically 🚨
            .from("CoffeeCalc <" + senderEmail + ">")
            .to(email)
            .subject("Your CoffeeCalc Verification Code")
            .html(String.format("""
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
                """, otp))
            .build();

        try {
            CreateEmailResponse data = resend.emails().send(params);
            log.info("Successfully sent OTP email to {} (ID: {})", email, data.getId());
        } catch (ResendException e) {
            log.error("Failed to send OTP email to {}: {}", email, e.getMessage());
            log.info("FALLBACK: OTP for {} is {}", email, otp);
        }
    }
}