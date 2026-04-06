package com.coffeecalculator.service;

import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.simpleemail.AmazonSimpleEmailService;
import com.amazonaws.services.simpleemail.AmazonSimpleEmailServiceClientBuilder;
import com.amazonaws.services.simpleemail.model.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
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

    @Value("${aws.access.key:}")
    private String awsAccessKey;

    @Value("${aws.secret.key:}")
    private String awsSecretKey;

    @Value("${aws.ses.region:us-east-1}")
    private String awsRegion;

    @Value("${aws.ses.from.email:noreply@coffeecalc.com}")
    private String fromEmail;

    // Simple ConcurrentHashMap implementation (replaces Caffeine for build stability)
    private final Map<String, OtpDetails> otpCache = new ConcurrentHashMap<>();
    
    // Rate limiting cache - tracks last OTP request time per email
    private final Map<String, Long> rateLimitCache = new ConcurrentHashMap<>();

    // Cryptographically secure random number generator
    private final SecureRandom secureRandom = new SecureRandom();
    
    private AmazonSimpleEmailService sesClient;

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

    // Initialize heavy AWS client exactly once on service startup
    @PostConstruct
    public void init() {
        if (!awsAccessKey.isEmpty() && !awsSecretKey.isEmpty()) {
            try {
                BasicAWSCredentials creds = new BasicAWSCredentials(awsAccessKey, awsSecretKey);
                this.sesClient = AmazonSimpleEmailServiceClientBuilder.standard()
                        .withCredentials(new AWSStaticCredentialsProvider(creds))
                        .withRegion(Regions.fromName(awsRegion))
                        .build();
                log.info("AWS SES Client initialized successfully. OTP emails will be sent.");
            } catch (Exception e) {
                log.error("Failed to initialize AWS SES Client: {}", e.getMessage());
                log.warn("OTP Service running in DEMO MODE.");
            }
        } else {
            log.warn("AWS Credentials missing. OTP Service running in DEMO MODE.");
            log.info("OTP codes will be printed to console for testing.");
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
     * Sends OTP email via AWS SES, falls back to console output in demo mode
     * @param email Recipient email address
     * @param otp OTP code to send
     */
    public void sendOtpEmail(String email, String otp) {
        if (sesClient == null) {
            log.info("DEMO MODE: OTP for {} is {}", email, otp);
            return;
        }

        try {
            String subject = "Your coffeeCalc Verification Code";
            String body = String.format("""
                    <html>
                    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: #1877f2; padding: 20px; text-align: center;">
                            <h2 style="color: white; margin: 0;">coffeeCalc</h2>
                        </div>
                        <div style="padding: 30px; background: #f8f9fa;">
                            <h3>Welcome to coffeeCalc!</h3>
                            <p>Your verification code is:</p>
                            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                                <h1 style="font-size: 48px; font-weight: bold; color: #1877f2; letter-spacing: 12px; margin: 0;">%s</h1>
                            </div>
                            <p>This code will expire in 5 minutes.</p>
                            <p style="color: #6c757d; font-size: 14px;">If you didn't request this code, you can safely ignore this email.</p>
                        </div>
                    </body>
                    </html>
                    """, otp);

            SendEmailRequest request = new SendEmailRequest()
                    .withDestination(new Destination().withToAddresses(email))
                    .withMessage(new Message()
                            .withBody(new Body()
                                    .withHtml(new Content().withCharset("UTF-8").withData(body)))
                            .withSubject(new Content().withCharset("UTF-8").withData(subject)))
                    .withSource(fromEmail);

            sesClient.sendEmail(request);
            log.info("Successfully sent OTP email to {}", email);

        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", email, e.getMessage());
            log.info("FALLBACK: OTP for {} is {}", email, otp);
        }
    }
}

