package com.coffeecalculator.controller;

import com.coffeecalculator.model.Recipe;
import com.coffeecalculator.repository.RecipeRepository;
import com.coffeecalculator.service.CommunityService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/community")
@PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
public class CommunityController {

    private final RecipeRepository recipeRepository;
    private final CommunityService communityService;

    public CommunityController(RecipeRepository recipeRepository,
                               CommunityService communityService) {
        this.recipeRepository = recipeRepository;
        this.communityService = communityService;
    }

    /**
     * Get all public recipes from the community market
     * Cross-tenant - shows recipes from all shops with creator credits
     */
    @GetMapping("/recipes")
    public ResponseEntity<List<Recipe>> getAllPublicRecipes() {
        List<Recipe> publicRecipes = recipeRepository.findAllPublishedToCommunity();
        return ResponseEntity.ok(publicRecipes);
    }

    /**
     * Publish a shop's private recipe to the community market
     * Automatically sets original creator attribution
     */
    @PostMapping("/recipes/{id}/publish")
    public ResponseEntity<Recipe> publishRecipe(@PathVariable Long id) {
        try {
            Recipe published = communityService.publishRecipe(id);
            return ResponseEntity.ok(published);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Clone a public recipe into the current user's shop
     * Preserves original creator credit
     */
    @PostMapping("/recipes/{id}/clone")
    public ResponseEntity<Recipe> cloneRecipe(@PathVariable Long id) {
        try {
            Recipe cloned = communityService.cloneRecipeToCurrentShop(id);
            return ResponseEntity.ok(cloned);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
