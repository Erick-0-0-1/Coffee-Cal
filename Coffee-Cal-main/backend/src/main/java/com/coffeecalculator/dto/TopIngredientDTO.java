package com.coffeecalculator.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Data Transfer Object for Recipe Ingredients.
 * This class must match the fields being accessed in the Controller.
 */
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

    // This is the missing piece that caused your build to fail
    // This field was missing, which caused the "cannot find symbol" error
    private Long shopId; 
}