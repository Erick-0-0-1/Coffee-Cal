package com.coffeecalculator.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecipeStatisticsDTO {
    private int totalRecipes;
    private BigDecimal averageSellingPrice;
    private BigDecimal averageCost;
    private BigDecimal averageMargin;
    private int simpleRecipes;
    private int moderateRecipes;
    private int complexRecipes;
    private int veryComplexRecipes;
}