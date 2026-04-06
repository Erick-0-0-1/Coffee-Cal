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
        // 1. Calculate Summary Metrics
        DashboardSummaryDTO summary = calculateSummaryMetrics();

        // 2. Find Top Ingredients (Requires aggregation logic on RecipeRepository)
        List<TopIngredientDTO> topIngredients = findTopIngredients();

        // 3. Find Recent Recipes (e.g., last 10 published)
        List<RecentRecipeDTO> recentRecipes = findRecentRecipes();

        // 4. Bundle everything
        return new DashboardDataBundleDTO(summary, topIngredients, recentRecipes);
    }

    private DashboardSummaryDTO calculateSummaryMetrics() {
        long totalUsers = userRepository.count();
        long totalRecipes = recipeRepository.count();

        // Assuming RecipeRepository has a method to calculate average rating
        double avgRating = recipeRepository.calculateAverageRating();

        // Find the most recent activity date across users and recipes
        LocalDateTime lastActivity = Math.max(
                userRepository.findMostRecentActivity(), 
                recipeRepository.findMostRecentActivity()
        );

        return new DashboardSummaryDTO(totalUsers, totalRecipes, avgRating, lastActivity != null ? lastActivity : LocalDateTime.now());
    }

    private List<TopIngredientDTO> findTopIngredients() {
        // *** IMPORTANT: This method relies on a custom query or aggregation in RecipeRepository ***
        // Example usage assumes RecipeRepository can provide a Map<String, Long>
        Map<String, Long> usageCounts = recipeRepository.getIngredientUsageCounts();

        return usageCounts.entrySet().stream()
                .map(entry -> new TopIngredientDTO(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());
    }

    private List<RecentRecipeDTO> findRecentRecipes() {
        // Fetch the N most recent recipes (e.g., 10)
        List<RecipeDTO> recentRecipesDTOs = recipeRepository.findTopNByDate(10);

        return recentRecipesDTOs.stream()
                .map(dto -> new RecentRecipeDTO(
                        dto.getId(), 
                        dto.getTitle(), 
                        dto.getPrimaryIngredient(), 
                        dto.getAverageRating(), 
                        dto.getPublishedDate()
                ))
                .collect(Collectors.toList());
    }
}