package com.coffeecalculator.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "coffee_shops")
@Getter
@Setter
@NoArgsConstructor
public class CoffeeShop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Shop name is required")
    @Column(nullable = false)
    private String name;

    @Column(unique = true)
    private String email;

    private String phone;

    private String address;

    private String timezone;

    private String currency;

    // POS Integration configuration
    @Column(name = "pos_provider")
    private String posProvider; // MOCK_SQUARE, SQUARE, CLOVER, etc.

    @Column(name = "pos_api_key")
    private String posApiKey;

    @Column(name = "pos_enabled", nullable = false)
    private boolean posEnabled = false;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
