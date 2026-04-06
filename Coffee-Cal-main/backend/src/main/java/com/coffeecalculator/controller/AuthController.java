package com.coffeecalculator.controller;

import com.coffeecalculator.dto.LoginRequest;
import com.coffeecalculator.dto.OtpRequest;
import com.coffeecalculator.dto.UserRegistrationRequest;
import com.coffeecalculator.dto.UserResponse;
import com.coffeecalculator.service.AuthService;
import com.coffeecalculator.service.OtpService;
import com.coffeecalculator.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;
    private final UserService userService;

    public AuthController(AuthService authService, OtpService otpService, UserService userService) {
        this.authService = authService;
        this.otpService = otpService;
        this.userService = userService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        System.out.println("--- LOGIN ATTEMPT ---");
        System.out.println("Identifier received: " + request.getUsername());
        
        if (request.getUsername() == null || request.getPassword() == null) {
            System.out.println("FAILED: Missing credentials in request body.");
            return new ResponseEntity<>(Map.of("error", "Username/Email and password are required."), HttpStatus.BAD_REQUEST);
        }

        try {
            Map<String, Object> response = authService.authenticate(request);
            System.out.println("SUCCESS: User authenticated.");
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            System.out.println("FAILED: Authentication rejected by Spring Security. Reason: " + e.getMessage());
            return new ResponseEntity<>(Map.of("error", "Invalid credentials provided."), HttpStatus.UNAUTHORIZED);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserRegistrationRequest request) {
        System.out.println("--- REGISTER ATTEMPT ---");
        System.out.println("Registering email: " + request.getEmail());
        try {
            String message = authService.register(request);
            return new ResponseEntity<>(Map.of("message", message), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(Map.of("error", e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody OtpRequest request) {
        if (request.getEmail() == null) {
            return new ResponseEntity<>(Map.of("error", "Email is required"), HttpStatus.BAD_REQUEST);
        }
        
        String otp = otpService.generateOtp(request.getEmail());
        
        if (otp == null) {
            return new ResponseEntity<>(Map.of("error", "Too many requests. Please wait 60 seconds."), HttpStatus.TOO_MANY_REQUESTS);
        }
        
        otpService.sendOtpEmail(request.getEmail(), otp);
        return new ResponseEntity<>(Map.of("message", "OTP sent successfully"), HttpStatus.OK);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody OtpRequest request) {
        System.out.println("--- OTP VERIFICATION ATTEMPT ---");
        System.out.println("Email: " + request.getEmail());
        System.out.println("OTP: " + request.getOtp());
        System.out.println("Username provided: " + request.getUsername());
        
        if (request.getEmail() == null || request.getOtp() == null) {
            return new ResponseEntity<>(Map.of("error", "Email and OTP are required"), HttpStatus.BAD_REQUEST);
        }
        
        // If your frontend only sends {email, otp}, this guard will trip! 
        if (request.getUsername() == null || request.getPassword() == null) {
            System.out.println("FAILED: Frontend did not send username/password along with the OTP.");
            return new ResponseEntity<>(Map.of("error", "Registration details (username/password) are missing from the OTP request. Please check frontend."), HttpStatus.BAD_REQUEST);
        }
        
        try {
            boolean valid = otpService.verifyOtp(request.getEmail(), request.getOtp());
            
            if (!valid) {
                System.out.println("FAILED: OTP is invalid or expired.");
                return new ResponseEntity<>(Map.of("error", "Invalid or expired OTP"), HttpStatus.BAD_REQUEST);
            }
            
            // Save the user securely in the database
            userService.registerUser(request.getUsername(), request.getEmail(), request.getPassword());
            System.out.println("SUCCESS: User successfully saved to the database!");
            
            return new ResponseEntity<>(Map.of("message", "OTP verified and user created successfully"), HttpStatus.OK);
            
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(Map.of("error", e.getMessage()), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("error", "An unexpected error occurred."), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        return userService.findByUsername(username)
                .map(user -> ResponseEntity.ok((Object) new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getRoles())))
                .orElse(new ResponseEntity<>("User not found", HttpStatus.NOT_FOUND));
    }
}