package com.coffeecalculator.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecipeIngredientDTO {
    private Long id;
    private Long ingredientId;
    
    // Matched to Service: riDTO.setIngredientName(...)
    private String ingredientName; 
    
    private Double quantity;
    private String unit;
    
    // Matched to Service: riDTO.setLineCost(...)
    // BigDecimal type fixes the "incompatible types" error
    private BigDecimal lineCost; 
    
    private Long shopId;
}