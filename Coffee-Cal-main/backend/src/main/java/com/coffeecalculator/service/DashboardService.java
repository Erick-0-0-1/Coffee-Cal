package com.coffeecalculator.service;

import com.coffeecalculator.dto.*;
import com.coffeecalculator.repository.RecipeRepository;
import com.coffeecalculator.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final UserRepository userRepository;
    private final RecipeRepository recipeRepository;

    @Autowired
    public DashboardService(UserRepository userRepository, RecipeRepository recipeRepository) {
        this.userRepository = userRepository;
        this.recipeRepository = recipeRepository;
    }

    /**
     * Generates a comprehensive dashboard data bundle for the frontend.
     */
    public DashboardDataBundleDTO getDashboardData() {
        return new DashboardDataBundleDTO();
    }

/*
    private DashboardSummaryDTO calculateSummaryMetrics() {
        long totalUsers = userRepository.count();
        long totalRecipes = recipeRepository.count();

        // Assuming RecipeRepository has a method to calculate average rating
        double avgRating = recipeRepository.calculateAverageRating();

        // Find the most recent activity date across users and recipes
        LocalDateTime userActivity = userRepository.findMostRecentActivity();
        LocalDateTime recipeActivity = recipeRepository.findMostRecentActivity();
        LocalDateTime lastActivity = null;
        
        if (userActivity != null && recipeActivity != null) {
            lastActivity = userActivity.isAfter(recipeActivity) ? userActivity : recipeActivity;
        } else if (userActivity != null) {
            lastActivity = userActivity;
        } else if (recipeActivity != null) {
            lastActivity = recipeActivity;
        }

        return new DashboardSummaryDTO(java.math.BigDecimal.valueOf(totalUsers), java.math.BigDecimal.valueOf(totalRecipes), avgRating, lastActivity != null ? lastActivity : LocalDateTime.now());
    }
*/

/*
    private List<TopIngredientDTO> findTopIngredients() {
        // *** IMPORTANT: This method relies on a custom query or aggregation in RecipeRepository ***
        List<Object[]> usageData = recipeRepository.getIngredientUsageCounts();
        Map<String, Long> usageCounts = usageData.stream()
            .collect(Collectors.toMap(
                obj -> (String) obj[0],
                obj -> (Long) obj[1]
            ));

        return usageCounts.entrySet().stream()
                .map(entry -> new TopIngredientDTO(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());
    }

    private List<RecentRecipeDTO> findRecentRecipes() {
        // Fetch the N most recent recipes (e.g., 10)
        List<com.coffeecalculator.model.Recipe> recentRecipes = recipeRepository.findTopNByDate(10);

        return recentRecipes.stream()
                .map(recipe -> {
                    RecipeDTO dto = new RecipeDTO();
                    dto.setId(recipe.getId());
                    dto.setDrinkName(recipe.getDrinkName());
                    dto.setTitle(recipe.getDrinkName());
                    return new RecentRecipeDTO(
                            recipe.getId(), 
                            recipe.getDrinkName(), 
                            null, 
                            null, 
                            recipe.getCreatedAt()
                    );
                })
                .collect(Collectors.toList());
    }
*/
}