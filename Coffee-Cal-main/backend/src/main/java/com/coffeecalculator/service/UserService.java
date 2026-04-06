package com.coffeecalculator.service;

import com.coffeecalculator.model.User;
import com.coffeecalculator.model.Role;
import com.coffeecalculator.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
        initializeTestUsers();
    }

    private void initializeTestUsers() {
        if (userRepository.findByUsername("admin").isEmpty()) {
            seedUser("admin", "admin123", "admin@coffeecalculator.com", Set.of(Role.OWNER));
            log.info("Seeded test user: admin");
        }
        if (userRepository.findByUsername("user").isEmpty()) {
            seedUser("user", "user123", "user@coffeecalculator.com", Set.of(Role.BARISTA));
            log.info("Seeded test user: user");
        }
    }

    private void seedUser(String username, String password, String email, Set<Role> roles) {
        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setEmail(email);
        user.setRoles(roles);
        userRepository.save(user);
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    // ← ADDED: required by CustomUserDetailsService for email-based lookup
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email);
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
        if (userRepository.findByUsername(username).isPresent()) {
            log.warn("Registration failed: Username '{}' already taken.", username);
            throw new IllegalArgumentException("Username already taken.");
        }

        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            log.warn("Registration failed: Email '{}' already in use.", email);
            throw new IllegalArgumentException("Email already registered.");
        }

        User newUser = new User();
        newUser.setUsername(username);
        newUser.setPasswordHash(passwordEncoder.encode(rawPassword));
        newUser.setEmail(email);
        newUser.setRoles(Set.of(Role.BARISTA));

        User saved = userRepository.save(newUser);
        log.info("Successfully registered new user: {} (ID: {})", username, saved.getId());
        return saved;
    }
}