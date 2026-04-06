package com.coffeecalculator.controller;

import com.coffeecalculator.dto.IngredientDTO;
import com.coffeecalculator.service.IngredientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Ingredient operations
 * Provides RESTful API endpoints for managing ingredients
 */
@RestController
@RequestMapping("/api/ingredients")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "${cors.allowed-origins}"})
public class IngredientController {

    private final IngredientService ingredientService;

    /**
     * GET /api/ingredients - Get all ingredients
     */
    @GetMapping
    public ResponseEntity<List<IngredientDTO>> getAllIngredients() {
        List<IngredientDTO> ingredients = ingredientService.getAllIngredients();
        return ResponseEntity.ok(ingredients);
    }

    /**
     * GET /api/ingredients/{id} - Get ingredient by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<IngredientDTO> getIngredientById(@PathVariable Long id) {
        try {
            IngredientDTO ingredient = ingredientService.getIngredientById(id);
            return ResponseEntity.ok(ingredient);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * POST /api/ingredients - Create new ingredient
     */
    @PostMapping
    public ResponseEntity<IngredientDTO> createIngredient(@Valid @RequestBody IngredientDTO ingredientDTO) {
        try {
            IngredientDTO created = ingredientService.createIngredient(ingredientDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * PUT /api/ingredients/{id} - Update ingredient
     */
    @PutMapping("/{id}")
    public ResponseEntity<IngredientDTO> updateIngredient(
            @PathVariable Long id,
            @Valid @RequestBody IngredientDTO ingredientDTO) {
        try {
            IngredientDTO updated = ingredientService.updateIngredient(id, ingredientDTO);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * DELETE /api/ingredients/{id} - Delete ingredient
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIngredient(@PathVariable Long id) {
        try {
            ingredientService.deleteIngredient(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * GET /api/ingredients/search?term={searchTerm} - Search ingredients
     */
    @GetMapping("/search")
    public ResponseEntity<List<IngredientDTO>> searchIngredients(@RequestParam String term) {
        List<IngredientDTO> results = ingredientService.searchIngredients(term);
        return ResponseEntity.ok(results);
    }

    /**
     * GET /api/ingredients/category/{category} - Get ingredients by category
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<List<IngredientDTO>> getIngredientsByCategory(@PathVariable String category) {
        List<IngredientDTO> ingredients = ingredientService.getIngredientsByCategory(category);
        return ResponseEntity.ok(ingredients);
    }

    /**
     * GET /api/ingredients/categories - Get all categories
     */
    @GetMapping("/categories")
    public ResponseEntity<List<String>> getAllCategories() {
        List<String> categories = ingredientService.getAllCategories();
        return ResponseEntity.ok(categories);
    }
}