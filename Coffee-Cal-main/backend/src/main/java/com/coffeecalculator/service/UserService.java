package com.coffeecalculator.service;

import com.coffeecalculator.model.User;
import com.coffeecalculator.model.Role;
import com.coffeecalculator.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.annotation.PostConstruct;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.Set;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;

    public UserService(PasswordEncoder passwordEncoder, UserRepository userRepository) {
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
    }

    @PostConstruct
    public void init() {
        initializeTestUsers();
    }

    private void initializeTestUsers() {
        if (userRepository.count() == 0) {
            registerTestUser("admin", "admin123", "admin@coffeecalculator.com", Set.of(Role.ADMIN));
            registerTestUser("user", "user123", "user@coffeecalculator.com", Set.of(Role.USER));
            log.info("Test users initialized successfully.");
        }
    }

    // Helper method to safely initialize test users using consistent registration logic
    private void registerTestUser(String username, String password, String email, Set<Role> roles) {
        if (!userRepository.existsByUsername(username)) {
            User user = User.builder()
                    .username(username)
                    .passwordHash(passwordEncoder.encode(password))
                    .email(email)
                    .coffeeShop(null)
                    .roles(roles)
                    .build();
            userRepository.save(user);
        }
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public boolean authenticate(String username, String rawPassword) {
        return findByUsername(username)
                .map(user -> {
                    boolean isValid = passwordEncoder.matches(rawPassword, user.getPasswordHash());
                    if (!isValid) {
                        log.debug("Authentication failed for user: {}", username);
                    }
                    return isValid;
                })
                .orElse(false);
    }

    public User registerUser(String username, String email, String rawPassword) {
        // Check for existing username
        if (userRepository.existsByUsername(username)) {
            log.warn("Registration failed: Username '{}' already taken.", username);
            throw new IllegalArgumentException("Username already taken.");
        }

        // Check for existing email across all registered users
        if (userRepository.existsByEmail(email)) {
            log.warn("Registration failed: Email '{}' already in use.", email);
            throw new IllegalArgumentException("Email already registered.");
        }
        
        User newUser = User.builder()
                .username(username)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .email(email)
                .coffeeShop(null)
                .roles(Set.of(Role.USER))
                .build();
        
        userRepository.save(newUser);
        log.info("Successfully registered new user: {} (ID: {})", username, newUser.getId());
        return newUser;
    }
}

