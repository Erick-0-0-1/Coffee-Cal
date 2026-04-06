package com.coffeecalculator.service;

import com.coffeecalculator.model.User;
import com.coffeecalculator.model.Role;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final PasswordEncoder passwordEncoder;
    
    // Thread-safe concurrent map for user storage
    private final Map<String, User> userMap = new ConcurrentHashMap<>();
    
    // Thread-safe atomic ID generator - prevents duplicate IDs
    private final AtomicLong idGenerator = new AtomicLong(0);

    @org.springframework.beans.factory.annotation.Autowired
    public UserService(@org.springframework.context.annotation.Lazy PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
        initializeTestUsers();
    }

    private void initializeTestUsers() {
        registerTestUser("admin", "admin123", "admin@coffeecalculator.com", Set.of(Role.ADMIN));
        registerTestUser("user", "user123", "user@coffeecalculator.com", Set.of(Role.USER));
        log.info("Test users initialized successfully.");
    }

    // Helper method to safely initialize test users using consistent registration logic
    private void registerTestUser(String username, String password, String email, Set<Role> roles) {
        User user = User.builder()
                .id(idGenerator.incrementAndGet())
                .username(username)
                .passwordHash(passwordEncoder.encode(password))
                .email(email)
                .coffeeShop(null)
                .roles(roles)
                .build();
        userMap.put(username, user);
    }

    public Optional<User> findByUsername(String username) {
        return Optional.ofNullable(userMap.get(username));
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
        if (userMap.containsKey(username)) {
            log.warn("Registration failed: Username '{}' already taken.", username);
            throw new IllegalArgumentException("Username already taken.");
        }

        // Check for existing email across all registered users
        boolean emailExists = userMap.values().stream()
                .anyMatch(user -> user.getEmail().equalsIgnoreCase(email));
        if (emailExists) {
            log.warn("Registration failed: Email '{}' already in use.", email);
            throw new IllegalArgumentException("Email already registered.");
        }
        
        // Safely generate unique sequential ID
        Long newId = idGenerator.incrementAndGet();
        
        User newUser = User.builder()
                .id(newId)
                .username(username)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .email(email)
                .coffeeShop(null)
                .roles(Set.of(Role.USER))
                .build();
        userMap.put(username, newUser);
        
        log.info("Successfully registered new user: {} (ID: {})", username, newId);
        return newUser;
    }
}

