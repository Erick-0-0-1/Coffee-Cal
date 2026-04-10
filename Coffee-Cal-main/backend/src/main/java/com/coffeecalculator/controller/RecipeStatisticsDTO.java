package com.coffeecalculator.controller;

import lombok.Data;
import java.math.BigDecimal;

@Data
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