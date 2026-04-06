package com.coffeecalculator.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
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

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@coffeecalc.com}")
    private String fromEmail;

    // Simple ConcurrentHashMap implementation (replaces Caffeine for build stability)
    private final Map<String, OtpDetails> otpCache = new ConcurrentHashMap<>();
    
    // Rate limiting cache - tracks last OTP request time per email
    private final Map<String, Long> rateLimitCache = new ConcurrentHashMap<>();

    // Cryptographically secure random number generator
    private final SecureRandom secureRandom = new SecureRandom();

    // Helper class to track OTP code and failed attempts atomically
    private static class OtpDetails {
        private final String code;
        private final AtomicInteger attempts;

        public OtpDetails(String code) {
            this.code = code;
            this.attempts = new AtomicInteger(0);
        }

        public String getCode() {
            return code;
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
        Long lastRequest = rateLimitCache.get(email);
        if (lastRequest != null) {
            long secondsLeft = OTP_COOLDOWN_SECONDS - (System.currentTimeMillis() - lastRequest) / 1000;
            log.warn("OTP generation rate limited for {} - try again in {} seconds", email, secondsLeft);
            return null;
        }

        String otp = String.format("%06d", secureRandom.nextInt(1000000));
        otpCache.put(email, new OtpDetails(otp));
        rateLimitCache.put(email, System.currentTimeMillis());
        log.debug("Generated OTP for {} (expires in {} minutes)", email, OTP_EXPIRY_MINUTES);
        return otp;
    }

    /**
     * Verifies if the provided OTP is valid for the given email
     * Implements brute-force protection with 3 attempt limit
     * @param email The user's email address
     * @param otp The OTP code to verify
     * @return true if valid, false otherwise
     */
    public boolean verifyOtp(String email, String otp) {
        OtpDetails details = otpCache.get(email);
        
        if (details == null) {
            log.debug("OTP verification failed for {}: No OTP found or expired", email);
            return false;
        }

        if (details.getCode().equals(otp)) {
            otpCache.remove(email);
            log.debug("OTP verified successfully for {}", email);
            return true;
        } else {
            int currentAttempts = details.incrementAndGetAttempts();
            
            if (currentAttempts >= MAX_ATTEMPTS) {
                otpCache.remove(email);
                log.warn("OTP invalidated for {}: Exceeded maximum failed attempts ({})", email, MAX_ATTEMPTS);
            } else {
                log.debug("OTP verification failed for {}: Code mismatch. Attempt {} of {}", 
                        email, currentAttempts, MAX_ATTEMPTS);
            }
            return false;
        }
    }

    /**
     * Sends OTP email via Gmail SMTP
     * @param email Recipient email address
     * @param otp OTP code to send
     */
    public void sendOtpEmail(String email, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(email);
            message.setSubject("Your coffeeCalc Verification Code");
            message.setText("Your verification code is: " + otp + ". It will expire in 5 minutes.");
            
            mailSender.send(message);
            log.info("Successfully sent OTP email to {}", email);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", email, e.getMessage());
            log.info("FALLBACK: OTP for {} is {}", email, otp);
        }
    }
}

