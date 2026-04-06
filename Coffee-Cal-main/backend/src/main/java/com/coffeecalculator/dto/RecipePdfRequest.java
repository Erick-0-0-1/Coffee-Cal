package com.coffeecalculator.dto;

import lombok.Getter;
import lombok.Setter;
import java.util.Map;

@Getter
@Setter
public class RecipePdfRequest {
    private Long recipeId;
    private Map<String, Boolean> sections;
}
