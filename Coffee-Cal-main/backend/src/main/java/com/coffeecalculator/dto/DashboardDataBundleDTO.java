package com.coffeecalculator.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardDataBundleDTO {
    private DashboardSummaryDTO summary;
    private List<TopIngredientDTO> topIngredients;
    private List<RecentRecipeDTO> recentRecipes;
}
