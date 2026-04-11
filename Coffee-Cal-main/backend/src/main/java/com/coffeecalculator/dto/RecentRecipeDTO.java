package com.coffeecalculator.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;

/**
 * Data Transfer Object for RecipeIngredient
 * Data Transfer Object for Recipe Ingredients.
 * This class must match the fields being accessed in the Controller.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecipeIngredientDTO {

    private Long id;

    @NotNull(message = "Ingredient ID is required")
    private Long ingredientId;

    private String ingredientName;
    private String category;
    private String baseUnit;
    private BigDecimal costPerBaseUnit;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private BigDecimal quantity;

    private BigDecimal lineCost;
}