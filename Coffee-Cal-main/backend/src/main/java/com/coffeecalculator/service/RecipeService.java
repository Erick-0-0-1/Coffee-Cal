package com.coffeecalculator.service;

import com.coffeecalculator.dto.RecipeDTO;
import com.coffeecalculator.dto.RecipeIngredientDTO;
import com.coffeecalculator.model.CoffeeShop;
import com.coffeecalculator.model.Ingredient;
import com.coffeecalculator.model.Recipe;
import com.coffeecalculator.model.RecipeIngredient;
import com.coffeecalculator.repository.CoffeeShopRepository;
import com.coffeecalculator.repository.IngredientRepository;
import com.coffeecalculator.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final IngredientRepository ingredientRepository;
    private final CoffeeShopRepository coffeeShopRepository; // Added to fix the shop link
    private final PricingService pricingService;

    public RecipeDTO createRecipe(RecipeDTO dto) {
        // 1. Fetch the CoffeeShop (Essential for multi-tenant data)
        CoffeeShop shop = coffeeShopRepository.findById(dto.getShopId())
                .orElseThrow(() -> new RuntimeException("Shop not found with id: " + dto.getShopId()));

        // 2. Validate uniqueness per shop
        if (recipeRepository.existsByCoffeeShopIdAndDrinkNameIgnoreCase(dto.getShopId(), dto.getDrinkName())) {
            throw new RuntimeException("Recipe with name '" + dto.getDrinkName() + "' already exists in this shop");
        }

        Recipe recipe = new Recipe();
        recipe.setCoffeeShop(shop); // Link the recipe to the shop
        recipe.setDrinkName(dto.getDrinkName());
        recipe.setTargetMarginPercent(dto.getTargetMarginPercent() != null ? dto.getTargetMarginPercent() : BigDecimal.ZERO);
        recipe.setNotes(dto.getNotes());

        // Process ingredients
        processIngredients(dto, recipe);

        recipe.calculateCosts();
        Recipe saved = recipeRepository.save(recipe);
        return convertToDTO(saved);
    }

    public RecipeDTO updateRecipe(Long id, RecipeDTO dto) {
        Recipe existing = recipeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recipe not found with id: " + id));

        // Check uniqueness if name is changing
        if (!existing.getDrinkName().equalsIgnoreCase(dto.getDrinkName())) {
            if (recipeRepository.existsByCoffeeShopIdAndDrinkNameIgnoreCase(existing.getCoffeeShop().getId(), dto.getDrinkName())) {
                throw new RuntimeException("New recipe name already exists in this shop");
            }
        }

        existing.setDrinkName(dto.getDrinkName());
        existing.setTargetMarginPercent(dto.getTargetMarginPercent());
        existing.setNotes(dto.getNotes());

        existing.getIngredients().clear();
        processIngredients(dto, existing);

        existing.calculateCosts();
        Recipe updated = recipeRepository.save(existing);
        return convertToDTO(updated);
    }

    private void processIngredients(RecipeDTO dto, Recipe recipe) {
        if (dto.getIngredients() == null) return;
        
        for (RecipeIngredientDTO ingredientDTO : dto.getIngredients()) {
            Ingredient ingredient = ingredientRepository.findById(ingredientDTO.getIngredientId())
                    .orElseThrow(() -> new RuntimeException("Ingredient not found: " + ingredientDTO.getIngredientId()));

            RecipeIngredient recipeIngredient = new RecipeIngredient();
            recipeIngredient.setRecipe(recipe);
            recipeIngredient.setIngredient(ingredient);
            recipeIngredient.setQuantity(ingredientDTO.getQuantity());
            recipeIngredient.calculateLineCost();

            recipe.getIngredients().add(recipeIngredient);
        }
    }

    private RecipeDTO convertToDTO(Recipe recipe) {
        pricingService.applyLivePricing(recipe);
        
        RecipeDTO dto = new RecipeDTO();
        dto.setId(recipe.getId());
        dto.setShopId(recipe.getCoffeeShop() != null ? recipe.getCoffeeShop().getId() : null);
        dto.setDrinkName(recipe.getDrinkName());
        dto.setTotalCost(recipe.getTotalCost());
        dto.setTargetMarginPercent(recipe.getTargetMarginPercent());
        dto.setSuggestedSellingPrice(recipe.getSuggestedSellingPrice());
        dto.setGrossProfit(recipe.getGrossProfit());
        dto.setActualMarginPercent(recipe.getActualMarginPercent());
        dto.setAllocatedExpensePerItem(recipe.getAllocatedExpensePerItem());
        dto.setNetProfit(recipe.getNetProfit());
        dto.setNetMarginPercent(recipe.getNetMarginPercent());
        dto.setFinalSellingPrice(recipe.getFinalSellingPrice());
        dto.setNotes(recipe.getNotes());
        dto.setComplexityLevel(recipe.getComplexityLevel());
        dto.setPricingCategory(recipe.getPricingCategory());

        List<RecipeIngredientDTO> ingredientDTOs = recipe.getIngredients().stream().map(ri -> {
            RecipeIngredientDTO riDTO = new RecipeIngredientDTO();
            riDTO.setId(ri.getId());
            riDTO.setIngredientId(ri.getIngredient().getId());
            riDTO.setIngredientName(ri.getIngredient().getName());
            riDTO.setQuantity(ri.getQuantity());
            riDTO.setLineCost(ri.getLineCost());
            return riDTO;
        }).collect(Collectors.toList());
        
        dto.setIngredients(ingredientDTOs);
        return dto;
    }

    // Keep other standard methods (getAll, getById, delete) as they were
}