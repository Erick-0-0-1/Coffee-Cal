package com.coffeecalculator.repository;

import com.coffeecalculator.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    @org.springframework.data.jpa.repository.Query(value = "SELECT last_login FROM users ORDER BY last_login DESC LIMIT 1", nativeQuery = true)
    java.time.LocalDateTime findMostRecentActivity();
}
