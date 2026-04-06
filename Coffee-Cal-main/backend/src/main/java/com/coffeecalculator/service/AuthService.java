package com.coffeecalculator.service;

import com.coffeecalculator.dto.LoginRequest;
import com.coffeecalculator.dto.UserRegistrationRequest;
import com.coffeecalculator.model.User;
import com.coffeecalculator.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;
    private final OtpService otpService;

    public AuthService(AuthenticationManager authenticationManager,
                       JwtTokenProvider jwtTokenProvider,
                       UserService userService,
                       OtpService otpService) {
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userService = userService;
        this.otpService = otpService;
    }

    public Map<String, Object> authenticate(LoginRequest request) {
        // Find by username or email, allowing flexible login
        User user = userService.findByUsername(request.getUsername())
                .or(() -> userService.findByEmail(request.getUsername()))
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getUsername(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String token = jwtTokenProvider.generateToken(userDetails);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("username", userDetails.getUsername());
        response.put("roles", userDetails.getAuthorities());
        
        return response;
    }

    public String register(UserRegistrationRequest request) {
        if (userService.findByUsername(request.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Username is already taken");
        }
        
        if (userService.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email is already registered");
        }

        String otp = otpService.generateOtp(request.getEmail());
        
        if (otp == null) {
            throw new IllegalArgumentException("Too many requests. Please wait 60 seconds.");
        }
        
        otpService.sendOtpEmail(request.getEmail(), otp);
        
        return "OTP sent successfully";
    }
}