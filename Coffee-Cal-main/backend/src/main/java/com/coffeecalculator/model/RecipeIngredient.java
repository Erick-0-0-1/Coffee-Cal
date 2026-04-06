package com.coffeecalculator.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * RecipeIngredient - Junction table for Recipe and Ingredient
 * Live pricing implementation - cost calculated on demand from current ingredient prices
 */
@Entity
@Table(name = "recipe_ingredients")
@Getter
@Setter
@NoArgsConstructor
public class RecipeIngredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Multi-Tenancy: Each recipe ingredient belongs to one coffee shop
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false)
    private CoffeeShop coffeeShop;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    @JsonBackReference
    @ToString.Exclude // Prevents infinite recursion in toString()
    private Recipe recipe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    @Column(nullable = false, precision = 10, scale = 4) // Precision for fine measurements
    private BigDecimal quantity; // Quantity in base unit (g, ml, pc)

    /**
     * LIVE PRICING: Calculated on demand using current ingredient price
     * Not persisted to database - always returns up-to-date cost
     */
    @Transient
    public BigDecimal getLineCost() {
        if (ingredient != null && ingredient.getCostPerBaseUnit() != null && quantity != null) {
            return ingredient.getCostPerBaseUnit()
                    .multiply(quantity)
                    .setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO;
    }

    /**
     * Get formatted quantity with proper unit and clean formatting
     */
    public String getFormattedQuantity() {
        if (ingredient != null && ingredient.getBaseUnit() != null) {
            return quantity.stripTrailingZeros().toPlainString() + " " + ingredient.getBaseUnit();
        }
        return quantity.stripTrailingZeros().toPlainString();
    }

    // Constructor for easy testing/creation
    public RecipeIngredient(Recipe recipe, Ingredient ingredient, BigDecimal quantity) {
        this.recipe = recipe;
        this.ingredient = ingredient;
        this.quantity = quantity;
    }
}
