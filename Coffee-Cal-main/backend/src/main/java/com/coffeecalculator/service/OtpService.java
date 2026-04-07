package com.coffeecalculator.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
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
    private static final int OTP_EXPIRY_MS      = 5 * 60 * 1000;  // 5 minutes
    private static final int OTP_COOLDOWN_MS    = 60 * 1000;       // 1 minute
    private static final int MAX_ATTEMPTS       = 3;

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    // email → OtpDetails
    private final Map<String, OtpDetails> otpCache      = new ConcurrentHashMap<>();
    // email → timestamp of last OTP generation
    private final Map<String, Long>       rateLimitCache = new ConcurrentHashMap<>();

    private final SecureRandom secureRandom = new SecureRandom();

    public OtpService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // ── Inner class ────────────────────────────────────────────────────────────
    public static class OtpDetails {
        private final String code;
        private final long   createdAt;
        private final AtomicInteger attempts = new AtomicInteger(0);
        private final String username;
        private final String password;

        public OtpDetails(String code, String username, String password) {
            this.code      = code;
            this.createdAt = System.currentTimeMillis();
            this.username  = username;
            this.password  = password;
        }

        public String  getCode()                  { return code; }
        public String  getUsername()               { return username; }
        public String  getPassword()               { return password; }
        public boolean isExpired(int expiryMs)     { return System.currentTimeMillis() - createdAt > expiryMs; }
        public int     incrementAndGetAttempts()   { return attempts.incrementAndGet(); }
    }

    // ── Generate OTP ───────────────────────────────────────────────────────────
    public String generateOtp(String email) {
        return generateOtp(email, null, null);
    }

    public String generateOtp(String email, String username, String password) {
        Long lastRequest = rateLimitCache.get(email);
        if (lastRequest != null && System.currentTimeMillis() - lastRequest < OTP_COOLDOWN_MS) {
            long secondsLeft = (OTP_COOLDOWN_MS - (System.currentTimeMillis() - lastRequest)) / 1000;
            log.warn("Rate limited OTP for {} — retry in {}s", email, secondsLeft);
            return null;
        }

        String otp = String.format("%06d", secureRandom.nextInt(1_000_000));
        otpCache.put(email, new OtpDetails(otp, username, password));
        rateLimitCache.put(email, System.currentTimeMillis());
        log.debug("Generated OTP for {} (expires in 5 min)", email);
        return otp;
    }

    // ── Verify OTP ─────────────────────────────────────────────────────────────
    public OtpDetails verifyOtp(String email, String otp) {
        OtpDetails details = otpCache.get(email);

        if (details == null) {
            log.debug("No OTP found for {}", email);
            return null;
        }

        // ✅ Check expiry (5 minutes)
        if (details.isExpired(OTP_EXPIRY_MS)) {
            otpCache.remove(email);
            rateLimitCache.remove(email); // allow immediate retry after expiry
            log.debug("OTP expired for {}", email);
            return null;
        }

        if (details.getCode().equals(otp)) {
            otpCache.remove(email);
            log.info("OTP verified successfully for {}", email);
            return details;
        }

        int attempts = details.incrementAndGetAttempts();
        if (attempts >= MAX_ATTEMPTS) {
            otpCache.remove(email);
            log.warn("OTP invalidated for {} after {} failed attempts", email, attempts);
        } else {
            log.debug("OTP mismatch for {} — attempt {}/{}", email, attempts, MAX_ATTEMPTS);
        }
        return null;
    }

    // ── Send OTP Email ─────────────────────────────────────────────────────────
    public void sendOtpEmail(String email, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("CoffeeCalc <" + senderEmail + ">");
            helper.setTo(email);
            helper.setSubject("Your CoffeeCalc Verification Code");
            helper.setText(buildEmailHtml(otp), true);

            mailSender.send(message);
            log.info("OTP email sent to {}", email);
        } catch (MessagingException e) {
            log.error("Failed to send OTP email to {}: {}", email, e.getMessage());
            // Re-throw so the controller can return a proper error to the client
            throw new RuntimeException("Failed to send verification email. Please try again.");
        }
    }

    // ── Scheduled cache cleanup (runs every 10 minutes) ────────────────────────
    // ✅ FIX: prevents memory leak from unbounded cache growth
    @Scheduled(fixedDelay = 600_000)
    public void cleanExpiredEntries() {
        long now = System.currentTimeMillis();

        otpCache.entrySet().removeIf(entry -> entry.getValue().isExpired(OTP_EXPIRY_MS));

        rateLimitCache.entrySet().removeIf(entry -> now - entry.getValue() > OTP_COOLDOWN_MS);

        log.debug("OTP cache cleanup complete. Remaining entries — otp: {}, rateLimit: {}",
                otpCache.size(), rateLimitCache.size());
    }

    // ── Email HTML template ────────────────────────────────────────────────────
    private String buildEmailHtml(String otp) {
        return String.format("""
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
              <div style="background:#2563eb;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
                <h1 style="color:white;margin:0;font-size:24px;">☕ coffeeCalc</h1>
              </div>
              <div style="padding:32px;background:#f8fafc;border:1px solid #e2e8f0;">
                <h2 style="color:#1e293b;margin-top:0;">Your Verification Code</h2>
                <p style="color:#475569;">Use the code below to verify your identity. It expires in <strong>5 minutes</strong>.</p>
                <div style="background:white;border:2px solid #2563eb;padding:24px;border-radius:12px;text-align:center;margin:24px 0;">
                  <span style="font-size:48px;font-weight:bold;color:#2563eb;letter-spacing:16px;">%s</span>
                </div>
                <p style="color:#94a3b8;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
              </div>
              <div style="padding:16px;text-align:center;color:#94a3b8;font-size:12px;">
                © 2025 coffeeCalc. All rights reserved.
              </div>
            </div>
            """, otp);
    }
}