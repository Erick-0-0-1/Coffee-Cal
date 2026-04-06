package com.coffeecalculator.controller;

import com.coffeecalculator.dto.LoginRequest;
import com.coffeecalculator.dto.OtpRequest;
import com.coffeecalculator.dto.UserRegistrationRequest;
import com.coffeecalculator.dto.UserResponse;
import com.coffeecalculator.model.User;
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
        if (request.getUsername() == null || request.getPassword() == null) {
            return new ResponseEntity<>("Username and password are required.", HttpStatus.BAD_REQUEST);
        }

        try {
            Map<String, Object> response = authService.authenticate(request);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Invalid credentials provided.", HttpStatus.UNAUTHORIZED);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserRegistrationRequest request) {
        try {
            UserResponse response = authService.register(request);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody OtpRequest request) {
        if (request.getEmail() == null) {
            return new ResponseEntity<>("Email is required", HttpStatus.BAD_REQUEST);
        }
        
        String otp = otpService.generateOtp(request.getEmail());
        
        if (otp == null) {
            return new ResponseEntity<>(Map.of("error", "Too many requests. Please wait 60 seconds before requesting a new code."), 
                    HttpStatus.TOO_MANY_REQUESTS);
        }
        
        otpService.sendOtpEmail(request.getEmail(), otp);
        return new ResponseEntity<>(Map.of("message", "OTP sent successfully"), HttpStatus.OK);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody OtpRequest request) {
        if (request.getEmail() == null || request.getOtp() == null) {
            return new ResponseEntity<>("Email and OTP are required", HttpStatus.BAD_REQUEST);
        }
        
        boolean valid = otpService.verifyOtp(request.getEmail(), request.getOtp());
        
        if (!valid) {
            return new ResponseEntity<>("Invalid or expired OTP", HttpStatus.BAD_REQUEST);
        }
        
        // Create user after OTP verification
        if (request.getUsername() != null && request.getPassword() != null) {
            userService.registerUser(request.getUsername(), request.getEmail(), request.getPassword());
        }
        
        return new ResponseEntity<>(Map.of("message", "OTP verified successfully"), HttpStatus.OK);
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

