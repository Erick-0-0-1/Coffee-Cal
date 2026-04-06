package com.coffeecalculator.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

/**
 * Ingredient Entity - Represents supplies/ingredients in the coffee shop
 * Demonstrates: Variables, Conditional Logic, Switch Statement
 */
@Entity
@Table(name = "ingredients")
@Getter
@Setter
@NoArgsConstructor
public class Ingredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Multi-Tenancy: Each ingredient belongs to one coffee shop
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false)
    private CoffeeShop coffeeShop;

    @NotBlank(message = "Ingredient name is required")
    @Column(nullable = false)
    private String name;

    @NotBlank(message = "Category is required")
    @Column(nullable = false)
    private String category; // Beans, Milk, Syrup, Packaging, Sauce

    @NotBlank(message = "Base unit is required")
    @Column(nullable = false)
    private String baseUnit; // g, ml, pc

    @NotNull(message = "Pack size is required")
    @Positive(message = "Pack size must be positive")
    @Column(nullable = false, precision = 10, scale = 4)
    private BigDecimal packSize; // Size of the pack in base units

    @NotNull(message = "Pack price is required")
    @Positive(message = "Pack price must be positive")
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal packPrice; // Price in PHP

    @Column(nullable = false, precision = 10, scale = 4)
    private BigDecimal costPerBaseUnit; // Automatically calculated

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(length = 500)
    private String notes;

    /**
     * PrePersist hook - demonstrates conditional logic
     */
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        calculateCostPerBaseUnit();
    }

    /**
     * PreUpdate hook - demonstrates conditional logic
     */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        calculateCostPerBaseUnit();
    }

    /**
     * Calculate cost per base unit
     * Demonstrates: Mathematical operations, conditional statements
     */
    public void calculateCostPerBaseUnit() {
        // Conditional: Check if packSize is valid
        if (packSize != null && packSize.compareTo(BigDecimal.ZERO) > 0 && packPrice != null) {
            // Calculate cost per base unit (g, ml, or pc)
            this.costPerBaseUnit = packPrice.divide(packSize, 4, RoundingMode.HALF_UP);
        } else {
            this.costPerBaseUnit = BigDecimal.ZERO;
        }
    }

    /**
     * Get unit display name - demonstrates switch statement
     */
    public String getUnitDisplayName() {
        // SWITCH STATEMENT DEMONSTRATION
        switch (this.baseUnit.toLowerCase()) {
            case "g":
                return "grams";
            case "ml":
                return "milliliters";
            case "pc":
                return "pieces";
            case "kg":
                return "kilograms";
            case "l":
                return "liters";
            default:
                return "units";
        }
    }

    /**
     * Validate category - demonstrates switch statement and conditional logic
     */
    public boolean isValidCategory() {
        // SWITCH STATEMENT for category validation
        switch (this.category.toLowerCase()) {
            case "beans":
            case "milk":
            case "syrup":
            case "packaging":
            case "sauce":
            case "powder":
            case "topping":
                return true;
            default:
                return false;
        }
    }

    /**
     * Get cost for specific quantity
     * Demonstrates: Variable operations, mathematical calculations
     */
    public BigDecimal getCostForQuantity(BigDecimal quantity) {
        // Variable operations
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return costPerBaseUnit.multiply(quantity).setScale(2, RoundingMode.HALF_UP);
    }
}