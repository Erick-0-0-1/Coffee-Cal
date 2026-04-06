package com.coffeecalculator.service;

import com.coffeecalculator.dto.RecipeDTO;
import com.coffeecalculator.dto.RecipeIngredientDTO;
import com.coffeecalculator.model.Ingredient;
import com.coffeecalculator.model.Recipe;
import com.coffeecalculator.model.RecipeIngredient;
import com.coffeecalculator.repository.IngredientRepository;
import com.coffeecalculator.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service layer for Recipe operations
 * Demonstrates: LOOPS, CONDITIONAL STATEMENTS, SWITCH, VARIABLES
 */
@Service
@RequiredArgsConstructor
@Transactional
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final IngredientRepository ingredientRepository;
    private final PricingService pricingService;

    /**
     * Get all recipes
     * Demonstrates: LOOPS (stream operations)
     */
    public List<RecipeDTO> getAllRecipes() {
        // Loop through all recipes and convert to DTOs
        return recipeRepository.findAllOrderedByName()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get recipe by ID
     * Demonstrates: CONDITIONAL LOGIC
     */
    public RecipeDTO getRecipeById(Long id) {
        // Conditional: Check if recipe exists
        return recipeRepository.findById(id)
                .map(this::convertToDTO)
                .orElseThrow(() -> new RuntimeException("Recipe not found with id: " + id));
    }

    /**
     * Create new recipe
     * Demonstrates: LOOPS, CONDITIONAL LOGIC, VARIABLE OPERATIONS
     */
    public RecipeDTO createRecipe(RecipeDTO dto) {
        // Conditional: Validate uniqueness
        if (recipeRepository.existsByDrinkNameIgnoreCase(dto.getDrinkName())) {
            throw new RuntimeException("Recipe with name '" + dto.getDrinkName() + "' already exists");
        }

        // Conditional: Validate margin
        if (dto.getTargetMarginPercent().compareTo(BigDecimal.ZERO) <= 0 ||
                dto.getTargetMarginPercent().compareTo(new BigDecimal("100")) >= 0) {
            throw new RuntimeException("Target margin must be between 0% and 100%");
        }

        // Create recipe entity
        Recipe recipe = new Recipe();
        recipe.setDrinkName(dto.getDrinkName());
        recipe.setTargetMarginPercent(dto.getTargetMarginPercent());
        recipe.setNotes(dto.getNotes());

        // LOOP: Add ingredients
        List<RecipeIngredient> recipeIngredients = new ArrayList<>();
        for (RecipeIngredientDTO ingredientDTO : dto.getIngredients()) {
            // Conditional: Validate ingredient exists
            Ingredient ingredient = ingredientRepository.findById(ingredientDTO.getIngredientId())
                    .orElseThrow(() -> new RuntimeException(
                            "Ingredient not found with id: " + ingredientDTO.getIngredientId()));

            // Create recipe ingredient
            RecipeIngredient recipeIngredient = new RecipeIngredient();
            recipeIngredient.setRecipe(recipe);
            recipeIngredient.setIngredient(ingredient);
            recipeIngredient.setQuantity(ingredientDTO.getQuantity());
            recipeIngredient.calculateLineCost();

            recipeIngredients.add(recipeIngredient);
        }

        recipe.setIngredients(recipeIngredients);

        // Calculate all costs
        recipe.calculateCosts();

        // Save and return
        Recipe saved = recipeRepository.save(recipe);
        return convertToDTO(saved);
    }

    /**
     * Update existing recipe
     * Demonstrates: LOOPS, CONDITIONAL LOGIC, VARIABLE UPDATES
     */
    public RecipeDTO updateRecipe(Long id, RecipeDTO dto) {
        // Conditional: Find existing recipe
        Recipe existing = recipeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recipe not found with id: " + id));

        // Conditional: Check if name is being changed
        if (!existing.getDrinkName().equalsIgnoreCase(dto.getDrinkName())) {
            if (recipeRepository.existsByDrinkNameIgnoreCase(dto.getDrinkName())) {
                throw new RuntimeException("Recipe with name '" + dto.getDrinkName() + "' already exists");
            }
        }

        // Update basic fields
        existing.setDrinkName(dto.getDrinkName());
        existing.setTargetMarginPercent(dto.getTargetMarginPercent());
        existing.setNotes(dto.getNotes());

        // Clear existing ingredients
        existing.getIngredients().clear();

        // LOOP: Add updated ingredients
        for (RecipeIngredientDTO ingredientDTO : dto.getIngredients()) {
            Ingredient ingredient = ingredientRepository.findById(ingredientDTO.getIngredientId())
                    .orElseThrow(() -> new RuntimeException(
                            "Ingredient not found with id: " + ingredientDTO.getIngredientId()));

            RecipeIngredient recipeIngredient = new RecipeIngredient();
            recipeIngredient.setRecipe(existing);
            recipeIngredient.setIngredient(ingredient);
            recipeIngredient.setQuantity(ingredientDTO.getQuantity());
            recipeIngredient.calculateLineCost();

            existing.getIngredients().add(recipeIngredient);
        }

        // Recalculate costs
        existing.calculateCosts();

        // Save and return
        Recipe updated = recipeRepository.save(existing);
        return convertToDTO(updated);
    }

    /**
     * Delete recipe
     * Demonstrates: CONDITIONAL LOGIC
     */
    public void deleteRecipe(Long id) {
        // Conditional: Check if exists
        if (!recipeRepository.existsById(id)) {
            throw new RuntimeException("Recipe not found with id: " + id);
        }
        recipeRepository.deleteById(id);
    }

    /**
     * Search recipes by name
     * Demonstrates: LOOPS, STRING OPERATIONS
     */
    public List<RecipeDTO> searchRecipes(String searchTerm) {
        return recipeRepository.findByDrinkNameContainingIgnoreCase(searchTerm)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get recipes by price range
     * Demonstrates: LOOPS, CONDITIONAL FILTERING
     */
    public List<RecipeDTO> getRecipesByPriceRange(BigDecimal minPrice, BigDecimal maxPrice) {
        // Conditional: Validate price range
        if (minPrice.compareTo(maxPrice) > 0) {
            throw new RuntimeException("Minimum price cannot be greater than maximum price");
        }

        return recipeRepository.findByPriceRange(minPrice, maxPrice)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Calculate what-if scenario for different margin
     * Demonstrates: CONDITIONAL LOGIC, MATHEMATICAL OPERATIONS
     */
    public RecipeDTO calculateWhatIfScenario(Long recipeId, BigDecimal newMarginPercent) {
        // Get existing recipe
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new RuntimeException("Recipe not found with id: " + recipeId));

        // Create a copy for what-if analysis (don't save)
        RecipeDTO whatIfDTO = convertToDTO(recipe);
        whatIfDTO.setTargetMarginPercent(newMarginPercent);

        // Recalculate with new margin
        BigDecimal totalCost = whatIfDTO.getTotalCost();

        // Conditional: Validate margin
        if (newMarginPercent.compareTo(BigDecimal.ZERO) > 0 &&
                newMarginPercent.compareTo(new BigDecimal("100")) < 0) {

            BigDecimal marginDecimal = newMarginPercent.divide(
                    new BigDecimal("100"), 4, java.math.RoundingMode.HALF_UP);
            BigDecimal divisor = BigDecimal.ONE.subtract(marginDecimal);

            if (divisor.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal newSellingPrice = totalCost.divide(
                        divisor, 2, java.math.RoundingMode.HALF_UP);
                BigDecimal newGrossProfit = newSellingPrice.subtract(totalCost);

                whatIfDTO.setSuggestedSellingPrice(newSellingPrice);
                whatIfDTO.setGrossProfit(newGrossProfit);
                whatIfDTO.setActualMarginPercent(newMarginPercent);
            }
        }

        return whatIfDTO;
    }

    /**
     * Get recipe statistics
     * Demonstrates: LOOPS, CONDITIONAL AGGREGATION, SWITCH
     */
    public RecipeStatisticsDTO getRecipeStatistics() {
        List<Recipe> allRecipes = recipeRepository.findAll();

        RecipeStatisticsDTO stats = new RecipeStatisticsDTO();
        stats.setTotalRecipes(allRecipes.size());

        // Conditional: Check if there are recipes
        if (allRecipes.isEmpty()) {
            stats.setAverageSellingPrice(BigDecimal.ZERO);
            stats.setAverageCost(BigDecimal.ZERO);
            stats.setAverageMargin(BigDecimal.ZERO);
            return stats;
        }

        // LOOP: Calculate averages
        BigDecimal totalPrice = BigDecimal.ZERO;
        BigDecimal totalCost = BigDecimal.ZERO;
        BigDecimal totalMargin = BigDecimal.ZERO;

        int simpleCount = 0, moderateCount = 0, complexCount = 0, veryComplexCount = 0;

        for (Recipe recipe : allRecipes) {
            totalPrice = totalPrice.add(recipe.getSuggestedSellingPrice());
            totalCost = totalCost.add(recipe.getTotalCost());
            totalMargin = totalMargin.add(recipe.getActualMarginPercent());

            // SWITCH: Count by complexity
            switch (recipe.getComplexityLevel()) {
                case "Simple":
                    simpleCount++;
                    break;
                case "Moderate":
                    moderateCount++;
                    break;
                case "Complex":
                    complexCount++;
                    break;
                case "Very Complex":
                    veryComplexCount++;
                    break;
            }
        }

        int recipeCount = allRecipes.size();
        stats.setAverageSellingPrice(totalPrice.divide(
                new BigDecimal(recipeCount), 2, java.math.RoundingMode.HALF_UP));
        stats.setAverageCost(totalCost.divide(
                new BigDecimal(recipeCount), 2, java.math.RoundingMode.HALF_UP));
        stats.setAverageMargin(totalMargin.divide(
                new BigDecimal(recipeCount), 2, java.math.RoundingMode.HALF_UP));

        stats.setSimpleRecipes(simpleCount);
        stats.setModerateRecipes(moderateCount);
        stats.setComplexRecipes(complexCount);
        stats.setVeryComplexRecipes(veryComplexCount);

        return stats;
    }

    /**
     * Convert Entity to DTO
     * Demonstrates: LOOPS, VARIABLE OPERATIONS
     */
    private RecipeDTO convertToDTO(Recipe recipe) {
        // Apply live pricing with current overhead costs
        pricingService.applyLivePricing(recipe);
        
        RecipeDTO dto = new RecipeDTO();
        dto.setId(recipe.getId());
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

        // LOOP: Convert ingredients
        List<RecipeIngredientDTO> ingredientDTOs = new ArrayList<>();
        for (RecipeIngredient ri : recipe.getIngredients()) {
            RecipeIngredientDTO riDTO = new RecipeIngredientDTO();
            riDTO.setId(ri.getId());
            riDTO.setIngredientId(ri.getIngredient().getId());
            riDTO.setIngredientName(ri.getIngredient().getName());
            riDTO.setCategory(ri.getIngredient().getCategory());
            riDTO.setBaseUnit(ri.getIngredient().getBaseUnit());
            riDTO.setCostPerBaseUnit(ri.getIngredient().getCostPerBaseUnit());
            riDTO.setQuantity(ri.getQuantity());
            riDTO.setLineCost(ri.getLineCost());
            ingredientDTOs.add(riDTO);
        }
        dto.setIngredients(ingredientDTOs);

        return dto;
    }

    /**
     * Statistics DTO class
     */
    @lombok.Data
    public static class RecipeStatisticsDTO {
        private int totalRecipes;
        private BigDecimal averageSellingPrice;
        private BigDecimal averageCost;
        private BigDecimal averageMargin;
        private int simpleRecipes;
        private int moderateRecipes;
        private int complexRecipes;
        private int veryComplexRecipes;
    }
}