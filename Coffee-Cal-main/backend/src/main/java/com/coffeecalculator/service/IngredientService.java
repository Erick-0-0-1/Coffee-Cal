package com.coffeecalculator.service;

import com.coffeecalculator.dto.IngredientDTO;
import com.coffeecalculator.model.Ingredient;
import com.coffeecalculator.repository.IngredientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service layer for Ingredient operations
 * Contains business logic and demonstrates programming concepts
 */
@Service
@RequiredArgsConstructor
@Transactional
public class IngredientService {

    private final IngredientRepository ingredientRepository;

    /**
     * Get all ingredients
     * Demonstrates: LOOPS (stream operations)
     */
    public List<IngredientDTO> getAllIngredients() {
        // Loop through all ingredients and convert to DTOs
        return ingredientRepository.findAllOrderedByCategoryAndName()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get ingredient by ID
     * Demonstrates: CONDITIONAL LOGIC
     */
    public IngredientDTO getIngredientById(Long id) {
        // Conditional: Check if ingredient exists
        return ingredientRepository.findById(id)
                .map(this::convertToDTO)
                .orElseThrow(() -> new RuntimeException("Ingredient not found with id: " + id));
    }

    /**
     * Create new ingredient
     * Demonstrates: CONDITIONAL VALIDATION, VARIABLE OPERATIONS
     */
    public IngredientDTO createIngredient(IngredientDTO dto) {
        // Conditional: Validate uniqueness
        if (ingredientRepository.existsByNameIgnoreCase(dto.getName())) {
            throw new RuntimeException("Ingredient with name '" + dto.getName() + "' already exists");
        }

        // Conditional: Validate category
        Ingredient ingredient = convertToEntity(dto);
        if (!ingredient.isValidCategory()) {
            throw new RuntimeException("Invalid category: " + dto.getCategory());
        }

        // Calculate cost per base unit
        ingredient.calculateCostPerBaseUnit();

        // Save and return
        Ingredient saved = ingredientRepository.save(ingredient);
        return convertToDTO(saved);
    }

    /**
     * Update existing ingredient
     * Demonstrates: CONDITIONAL LOGIC, VARIABLE UPDATES
     */
    public IngredientDTO updateIngredient(Long id, IngredientDTO dto) {
        // Conditional: Find existing ingredient
        Ingredient existing = ingredientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ingredient not found with id: " + id));

        // Conditional: Check if name is being changed and if new name already exists
        if (!existing.getName().equalsIgnoreCase(dto.getName())) {
            if (ingredientRepository.existsByNameIgnoreCase(dto.getName())) {
                throw new RuntimeException("Ingredient with name '" + dto.getName() + "' already exists");
            }
        }

        // Update fields
        existing.setName(dto.getName());
        existing.setCategory(dto.getCategory());
        existing.setBaseUnit(dto.getBaseUnit());
        existing.setPackSize(dto.getPackSize());
        existing.setPackPrice(dto.getPackPrice());
        existing.setNotes(dto.getNotes());

        // Recalculate cost
        existing.calculateCostPerBaseUnit();

        // Save and return
        Ingredient updated = ingredientRepository.save(existing);
        return convertToDTO(updated);
    }

    /**
     * Delete ingredient
     * Demonstrates: CONDITIONAL LOGIC
     */
    public void deleteIngredient(Long id) {
        // Conditional: Check if exists
        if (!ingredientRepository.existsById(id)) {
            throw new RuntimeException("Ingredient not found with id: " + id);
        }
        ingredientRepository.deleteById(id);
    }

    /**
     * Get ingredients by category
     * Demonstrates: LOOPS, FILTERING
     */
    public List<IngredientDTO> getIngredientsByCategory(String category) {
        return ingredientRepository.findByCategory(category)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Search ingredients by name
     * Demonstrates: LOOPS, STRING OPERATIONS
     */
    public List<IngredientDTO> searchIngredients(String searchTerm) {
        return ingredientRepository.findByNameContainingIgnoreCase(searchTerm)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all categories
     * Demonstrates: LOOPS, SWITCH for validation
     */
    public List<String> getAllCategories() {
        List<String> categories = ingredientRepository.findAllDistinctCategories();

        // Loop and validate each category
        return categories.stream()
                .filter(this::isValidCategoryString)
                .collect(Collectors.toList());
    }

    /**
     * Validate category using switch
     * Demonstrates: SWITCH STATEMENT
     */
    private boolean isValidCategoryString(String category) {
        // SWITCH STATEMENT for category validation
        switch (category.toLowerCase()) {
            case "beans":
            case "milk":
            case "syrup":
            case "packaging":
            case "sauce":
            case "powder":
            case "topping":
                return true;
            default:
                return false;
        }
    }

    /**
     * Convert Entity to DTO
     * Demonstrates: VARIABLE OPERATIONS
     */
    private IngredientDTO convertToDTO(Ingredient ingredient) {
        IngredientDTO dto = new IngredientDTO();
        dto.setId(ingredient.getId());
        dto.setName(ingredient.getName());
        dto.setCategory(ingredient.getCategory());
        dto.setBaseUnit(ingredient.getBaseUnit());
        dto.setPackSize(ingredient.getPackSize());
        dto.setPackPrice(ingredient.getPackPrice());
        dto.setCostPerBaseUnit(ingredient.getCostPerBaseUnit());
        dto.setNotes(ingredient.getNotes());
        return dto;
    }

    /**
     * Convert DTO to Entity
     * Demonstrates: VARIABLE OPERATIONS
     */
    private Ingredient convertToEntity(IngredientDTO dto) {
        Ingredient ingredient = new Ingredient();
        ingredient.setId(dto.getId());
        ingredient.setName(dto.getName());
        ingredient.setCategory(dto.getCategory());
        ingredient.setBaseUnit(dto.getBaseUnit());
        ingredient.setPackSize(dto.getPackSize());
        ingredient.setPackPrice(dto.getPackPrice());
        ingredient.setNotes(dto.getNotes());
        return ingredient;
    }
}