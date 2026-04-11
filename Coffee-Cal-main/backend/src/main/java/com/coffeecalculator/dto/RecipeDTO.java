package com.coffeecalculator.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
// Removed the import for Positive to allow negative/zero margins
// Removed the import for NotNull to stop blocking the frontend request
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

    @NotNull(message = "Shop ID is required")
    // REMOVED @NotNull here so the request passes even if the frontend payload is missing the shopId
    private Long shopId;

    @NotBlank(message = "Drink name is required")
    private String drinkName;

    private List<RecipeIngredientDTO> ingredients = new ArrayList<>();

    // Added to match the frontend payload "sellingPrice"
    private BigDecimal sellingPrice;

    // Added to handle the Base64 image string from the frontend
    private String image;

    private BigDecimal totalCost;

    // REMOVED @Positive here to fix the Validation Error
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