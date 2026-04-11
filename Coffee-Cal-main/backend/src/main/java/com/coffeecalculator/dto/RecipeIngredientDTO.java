package com.coffeecalculator.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecipeIngredientDTO {
    private Long id;
    private Long ingredientId;
    private String name;
    private Double quantity;
    private String unit;
    private Double cost;
    
    // This field was missing, which caused the "cannot find symbol" error
    private Long shopId; 
}