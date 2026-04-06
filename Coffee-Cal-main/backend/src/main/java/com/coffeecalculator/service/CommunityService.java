package com.coffeecalculator.service;

import com.coffeecalculator.config.TenantContext;
import com.coffeecalculator.model.CoffeeShop;
import com.coffeecalculator.model.Recipe;
import com.coffeecalculator.model.RecipeIngredient;
import com.coffeecalculator.repository.CoffeeShopRepository;
import com.coffeecalculator.repository.RecipeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;

@Service
public class CommunityService {

    private static final Logger log = LoggerFactory.getLogger(CommunityService.class);

    private final RecipeRepository recipeRepository;
    private final CoffeeShopRepository coffeeShopRepository;

    public CommunityService(RecipeRepository recipeRepository,
                            CoffeeShopRepository coffeeShopRepository) {
        this.recipeRepository = recipeRepository;
        this.coffeeShopRepository = coffeeShopRepository;
    }

    /**
     * Clones a public recipe into the current user's shop
     * Creates deep copy including all ingredients, preserves original creator credit
     */
    @Transactional
    public Recipe cloneRecipeToCurrentShop(Long publicRecipeId) {
        Long currentShopId = TenantContext.getCurrentShopId();
        log.info("Cloning recipe {} to shop {}", publicRecipeId, currentShopId);

        // 1. Find the public recipe
        Recipe publicRecipe = recipeRepository.findById(publicRecipeId)
            .filter(Recipe::isPublishedToCommunity)
            .orElseThrow(() -> new IllegalArgumentException("Public recipe not found"));

        // 2. Get current shop
        CoffeeShop currentShop = coffeeShopRepository.findById(currentShopId)
            .orElseThrow(() -> new IllegalArgumentException("Current shop not found"));

        // 3. Create deep copy of recipe - PRESERVES ORIGINAL CREATOR CREDIT
        Recipe clonedRecipe = new Recipe();
        clonedRecipe.setDrinkName(publicRecipe.getDrinkName() + " (Cloned)");
        clonedRecipe.setTargetMarginPercent(publicRecipe.getTargetMarginPercent());
        clonedRecipe.setAllocatedExpensePerItem(publicRecipe.getAllocatedExpensePerItem());
        clonedRecipe.setNotes(publicRecipe.getNotes());
        clonedRecipe.setCoffeeShop(currentShop);
        clonedRecipe.setPublishedToCommunity(false); // New copy is private by default
        clonedRecipe.setPosItemId(null); // Clear POS mapping for cloned recipe
        clonedRecipe.setOriginalCreatorName(publicRecipe.getOriginalCreatorName()); // PRESERVE CREDIT

        // 4. Clone all ingredients
        clonedRecipe.setIngredients(new ArrayList<>());
        for (RecipeIngredient originalIngredient : publicRecipe.getIngredients()) {
            RecipeIngredient clonedIngredient = new RecipeIngredient();
            clonedIngredient.setQuantity(originalIngredient.getQuantity());
            clonedIngredient.setRecipe(clonedRecipe);
            clonedIngredient.setCoffeeShop(currentShop);
            clonedRecipe.getIngredients().add(clonedIngredient);
        }

        // 5. Save everything
        Recipe savedRecipe = recipeRepository.save(clonedRecipe);
        log.info("Successfully cloned recipe {} to shop {}. Original creator: {}",
            publicRecipeId, currentShopId, publicRecipe.getOriginalCreatorName());

        return savedRecipe;
    }

    /**
     * Publishes an existing shop recipe to the community market
     * Automatically sets original creator name to current shop's name
     */
    @Transactional
    public Recipe publishRecipe(Long recipeId) {
        Long currentShopId = TenantContext.getCurrentShopId();

        Recipe recipe = recipeRepository.findById(recipeId)
            .filter(r -> r.getCoffeeShop().getId().equals(currentShopId)) // Verify ownership
            .orElseThrow(() -> new IllegalArgumentException("Recipe not found or not owned by shop"));

        if (recipe.isPublishedToCommunity()) {
            throw new IllegalArgumentException("Recipe is already published");
        }

        // Get current shop name for creator attribution
        CoffeeShop currentShop = coffeeShopRepository.findById(currentShopId)
            .orElseThrow(() -> new IllegalArgumentException("Current shop not found"));

        recipe.setPublishedToCommunity(true);
        recipe.setOriginalCreatorName(currentShop.getName()); // Auto-set creator credit
        
        Recipe saved = recipeRepository.save(recipe);
        log.info("Recipe {} published to community market by shop {} (creator: {})",
            recipeId, currentShopId, currentShop.getName());
            
        return saved;
    }

    /**
     * Unpublishes a recipe from the community market
     */
    @Transactional
    public Recipe unpublishRecipe(Long recipeId) {
        Long currentShopId = TenantContext.getCurrentShopId();

        Recipe recipe = recipeRepository.findById(recipeId)
            .filter(r -> r.getCoffeeShop().getId().equals(currentShopId))
            .orElseThrow(() -> new IllegalArgumentException("Recipe not found or not owned by shop"));

        recipe.setPublishedToCommunity(false);
        Recipe saved = recipeRepository.save(recipe);
        
        log.info("Recipe {} unpublished from community market by shop {}", recipeId, currentShopId);
        return saved;
    }
}
