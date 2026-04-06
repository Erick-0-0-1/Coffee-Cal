package com.coffeecalculator.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Transfer Object for Recipe
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecipeDTO {

    private Long id;

    @NotBlank(message = "Drink name is required")
    private String drinkName;

    private List<RecipeIngredientDTO> ingredients = new ArrayList<>();

    private BigDecimal totalCost;

    @NotNull(message = "Target margin is required")
    @Positive(message = "Target margin must be positive")
    private BigDecimal targetMarginPercent;

    private BigDecimal suggestedSellingPrice;
    private BigDecimal grossProfit;
    private BigDecimal actualMarginPercent;

    private String notes;

    // Additional computed fields for display
    private String complexityLevel;
    private String pricingCategory;
}