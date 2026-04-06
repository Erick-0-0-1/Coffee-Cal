package com.coffeecalculator.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Data Transfer Object for Ingredient
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class IngredientDTO {

    private Long id;

    @NotBlank(message = "Ingredient name is required")
    private String name;

    @NotBlank(message = "Category is required")
    private String category;

    @NotBlank(message = "Base unit is required")
    private String baseUnit;

    @NotNull(message = "Pack size is required")
    @Positive(message = "Pack size must be positive")
    private BigDecimal packSize;

    @NotNull(message = "Pack price is required")
    @Positive(message = "Pack price must be positive")
    private BigDecimal packPrice;

    private BigDecimal costPerBaseUnit;

    private String notes;
}