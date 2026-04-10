package com.coffeecalculator.service;

import com.coffeecalculator.dto.RecipeDTO;
import com.coffeecalculator.dto.RecipeIngredientDTO;
import com.coffeecalculator.dto.RecipeStatisticsDTO;
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
    private final CoffeeShopRepository coffeeShopRepository;
    private final PricingService pricingService;

    public List<RecipeDTO> getAllRecipes() {
        return recipeRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public RecipeDTO getRecipeById(Long id) {
        return recipeRepository.findById(id)
                .map(this::convertToDTO)
                .orElseThrow(() -> new RuntimeException("Recipe not found"));
    }

    public RecipeDTO createRecipe(RecipeDTO dto) {
        CoffeeShop shop = coffeeShopRepository.findById(dto.getShopId())
                .orElseThrow(() -> new RuntimeException("Shop not found with id: " + dto.getShopId()));

        if (recipeRepository.existsByCoffeeShopIdAndDrinkNameIgnoreCase(dto.getShopId(), dto.getDrinkName())) {
            throw new RuntimeException("Recipe name already exists in this shop");
        }

        Recipe recipe = new Recipe();
        recipe.setCoffeeShop(shop);
        recipe.setDrinkName(dto.getDrinkName());
        recipe.setTargetMarginPercent(dto.getTargetMarginPercent());
        recipe.setNotes(dto.getNotes());

        processIngredients(dto, recipe);
        recipe.calculateCosts();

        return convertToDTO(recipeRepository.save(recipe));
    }

    public RecipeDTO updateRecipe(Long id, RecipeDTO dto) {
        Recipe existing = recipeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recipe not found"));

        existing.setDrinkName(dto.getDrinkName());
        existing.setTargetMarginPercent(dto.getTargetMarginPercent());
        existing.setNotes(dto.getNotes());

        existing.getIngredients().clear();
        processIngredients(dto, existing);

        existing.calculateCosts();
        return convertToDTO(recipeRepository.save(existing));
    }

    public void deleteRecipe(Long id) {
        recipeRepository.deleteById(id);
    }

    public List<RecipeDTO> searchRecipes(String term) {
        return recipeRepository.findByDrinkNameContainingIgnoreCase(term).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<RecipeDTO> getRecipesByPriceRange(BigDecimal min, BigDecimal max) {
        return recipeRepository.findByPriceRange(min, max).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public RecipeDTO calculateWhatIfScenario(Long id, BigDecimal margin) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recipe not found"));
        return convertToDTO(recipe);
    }

    public RecipeStatisticsDTO getRecipeStatistics() {
        List<Recipe> recipes = recipeRepository.findAll();
        RecipeStatisticsDTO stats = new RecipeStatisticsDTO();
        stats.setTotalRecipes(recipes.size());
        stats.setAverageCost(BigDecimal.ZERO);
        stats.setAverageSellingPrice(BigDecimal.ZERO);
        stats.setAverageMargin(BigDecimal.ZERO);
        return stats;
    }

    private void processIngredients(RecipeDTO dto, Recipe recipe) {
        if (dto.getIngredients() == null) return;
        for (RecipeIngredientDTO ingDto : dto.getIngredients()) {
            Ingredient ingredient = ingredientRepository.findById(ingDto.getIngredientId())
                    .orElseThrow(() -> new RuntimeException("Ingredient not found"));
            RecipeIngredient ri = new RecipeIngredient();
            ri.setRecipe(recipe);
            ri.setIngredient(ingredient);
            ri.setQuantity(ingDto.getQuantity());
            ri.calculateLineCost();
            recipe.getIngredients().add(ri);
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
        dto.setNotes(recipe.getNotes());
        
        List<RecipeIngredientDTO> ingredientDTOs = recipe.getIngredients().stream().map(ri -> {
            RecipeIngredientDTO riDTO = new RecipeIngredientDTO();
            riDTO.setIngredientId(ri.getIngredient().getId());
            riDTO.setIngredientName(ri.getIngredient().getName());
            riDTO.setQuantity(ri.getQuantity());
            riDTO.setLineCost(ri.getLineCost());
            return riDTO;
        }).collect(Collectors.toList());
        
        dto.setIngredients(ingredientDTOs);
        return dto;
    }
}