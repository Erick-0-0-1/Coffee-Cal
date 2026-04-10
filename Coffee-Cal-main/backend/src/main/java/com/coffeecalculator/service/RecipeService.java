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
import java.math.RoundingMode;
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
                .orElseThrow(() -> new RuntimeException("Recipe not found with id: " + id));
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
        if (!recipeRepository.existsById(id)) {
            throw new RuntimeException("Cannot delete. Recipe not found with id: " + id);
        }
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
        
        // Temporarily update margin to see the impact on Suggested Price
        recipe.setTargetMarginPercent(margin);
        recipe.calculateCosts();
        
        return convertToDTO(recipe);
    }

    public RecipeStatisticsDTO getRecipeStatistics() {
        List<Recipe> recipes = recipeRepository.findAll();
        RecipeStatisticsDTO stats = new RecipeStatisticsDTO();
        
        if (recipes.isEmpty()) {
            stats.setTotalRecipes(0);
            stats.setAverageCost(BigDecimal.ZERO);
            stats.setAverageSellingPrice(BigDecimal.ZERO);
            stats.setAverageMargin(BigDecimal.ZERO);
            return stats;
        }

        int totalCount = recipes.size();
        BigDecimal sumCost = BigDecimal.ZERO;
        BigDecimal sumPrice = BigDecimal.ZERO;
        BigDecimal sumMargin = BigDecimal.ZERO;

        for (Recipe r : recipes) {
            r.calculateCosts(); // Ensure fresh numbers
            sumCost = sumCost.add(r.getTotalCost() != null ? r.getTotalCost() : BigDecimal.ZERO);
            sumPrice = sumPrice.add(r.getSuggestedSellingPrice() != null ? r.getSuggestedSellingPrice() : BigDecimal.ZERO);
            sumMargin = sumMargin.add(r.getActualMarginPercent() != null ? r.getActualMarginPercent() : BigDecimal.ZERO);
        }

        stats.setTotalRecipes(totalCount);
        stats.setAverageCost(sumCost.divide(BigDecimal.valueOf(totalCount), 2, RoundingMode.HALF_UP));
        stats.setAverageSellingPrice(sumPrice.divide(BigDecimal.valueOf(totalCount), 2, RoundingMode.HALF_UP));
        stats.setAverageMargin(sumMargin.divide(BigDecimal.valueOf(totalCount), 2, RoundingMode.HALF_UP));
        
        return stats;
    }

    private void processIngredients(RecipeDTO dto, Recipe recipe) {
        if (dto.getIngredients() == null) return;
        for (RecipeIngredientDTO ingDto : dto.getIngredients()) {
            Ingredient ingredient = ingredientRepository.findById(ingDto.getIngredientId())
                    .orElseThrow(() -> new RuntimeException("Ingredient not found with id: " + ingDto.getIngredientId()));
            
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
        
        if (recipe.getIngredients() != null) {
            List<RecipeIngredientDTO> ingredientDTOs = recipe.getIngredients().stream().map(ri -> {
                RecipeIngredientDTO riDTO = new RecipeIngredientDTO();
                riDTO.setIngredientId(ri.getIngredient().getId());
                riDTO.setIngredientName(ri.getIngredient().getName());
                riDTO.setQuantity(ri.getQuantity());
                riDTO.setLineCost(ri.getLineCost());
                return riDTO;
            }).collect(Collectors.toList());
            dto.setIngredients(ingredientDTOs);
        }
        
        return dto;
    }
}