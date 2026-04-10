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

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecipeDTO {

    private Long id;

    // This is the missing field causing the 400 Bad Request
    @NotNull(message = "Shop ID is required")
    private Long shopId;

    @NotBlank(message = "Drink name is required")
    private String drinkName;

    private List<RecipeIngredientDTO> ingredients = new ArrayList<>();

    private BigDecimal totalCost;

    @Positive(message = "Target margin must be positive")
    private BigDecimal targetMarginPercent;

    private BigDecimal suggestedSellingPrice;
    private BigDecimal grossProfit;
    private BigDecimal actualMarginPercent;

    private String notes;
    private String complexityLevel;
    private String pricingCategory;
    
    // Dashboard and Calculation fields
    private String title;
    private String primaryIngredient;
    private Double averageRating;
    private java.time.LocalDateTime publishedDate;
    
    private java.math.BigDecimal allocatedExpensePerItem;
    private java.math.BigDecimal netProfit;
    private java.math.BigDecimal netMarginPercent;
    private java.math.BigDecimal finalSellingPrice;
}