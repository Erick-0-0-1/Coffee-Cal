package com.coffeecalculator.controller;

import com.coffeecalculator.dto.RecipeDTO;
import com.coffeecalculator.dto.RecipePdfRequest;
import com.coffeecalculator.model.Recipe;
import com.coffeecalculator.repository.RecipeRepository;
import com.coffeecalculator.service.PdfService;
import com.coffeecalculator.service.RecipeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * REST Controller for Recipe operations
 * Provides RESTful API endpoints for managing recipes
 */
@RestController
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "${cors.allowed-origins}"})
public class RecipeController {

    private final RecipeService recipeService;
    private final RecipeRepository recipeRepository;
    private final PdfService pdfService;

    /**
     * GET /api/recipes - Get all recipes
     */
    @GetMapping
    public ResponseEntity<List<RecipeDTO>> getAllRecipes() {
        List<RecipeDTO> recipes = recipeService.getAllRecipes();
        return ResponseEntity.ok(recipes);
    }

    /**
     * GET /api/recipes/{id} - Get recipe by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<RecipeDTO> getRecipeById(@PathVariable Long id) {
        try {
            RecipeDTO recipe = recipeService.getRecipeById(id);
            return ResponseEntity.ok(recipe);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * POST /api/recipes - Create new recipe
     */
    @PostMapping
    public ResponseEntity<RecipeDTO> createRecipe(@Valid @RequestBody RecipeDTO recipeDTO) {
        try {
            RecipeDTO created = recipeService.createRecipe(recipeDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * PUT /api/recipes/{id} - Update recipe
     */
    @PutMapping("/{id}")
    public ResponseEntity<RecipeDTO> updateRecipe(
            @PathVariable Long id,
            @Valid @RequestBody RecipeDTO recipeDTO) {
        try {
            RecipeDTO updated = recipeService.updateRecipe(id, recipeDTO);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * DELETE /api/recipes/{id} - Delete recipe
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecipe(@PathVariable Long id) {
        try {
            recipeService.deleteRecipe(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * GET /api/recipes/search?term={searchTerm} - Search recipes
     */
    @GetMapping("/search")
    public ResponseEntity<List<RecipeDTO>> searchRecipes(@RequestParam String term) {
        List<RecipeDTO> results = recipeService.searchRecipes(term);
        return ResponseEntity.ok(results);
    }

    /**
     * GET /api/recipes/price-range?min={min}&max={max} - Get recipes by price range
     */
    @GetMapping("/price-range")
    public ResponseEntity<List<RecipeDTO>> getRecipesByPriceRange(
            @RequestParam BigDecimal min,
            @RequestParam BigDecimal max) {
        try {
            List<RecipeDTO> recipes = recipeService.getRecipesByPriceRange(min, max);
            return ResponseEntity.ok(recipes);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * POST /api/recipes/{id}/what-if?margin={margin} - Calculate what-if scenario
     */
    @PostMapping("/{id}/what-if")
    public ResponseEntity<RecipeDTO> calculateWhatIf(
            @PathVariable Long id,
            @RequestParam BigDecimal margin) {
        try {
            RecipeDTO whatIf = recipeService.calculateWhatIfScenario(id, margin);
            return ResponseEntity.ok(whatIf);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * GET /api/recipes/statistics - Get recipe statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<RecipeService.RecipeStatisticsDTO> getStatistics() {
        RecipeService.RecipeStatisticsDTO stats = recipeService.getRecipeStatistics();
        return ResponseEntity.ok(stats);
    }

    /**
     * POST /api/recipes/{id}/export-pdf - Export recipe to PDF with selected sections
     */
    @PostMapping("/{id}/export-pdf")
    public ResponseEntity<byte[]> exportRecipePdf(
            @PathVariable Long id,
            @RequestBody RecipePdfRequest request) {
        
        return recipeRepository.findById(id)
                .map(recipe -> {
                    byte[] pdfBytes = pdfService.generateRecipePdf(recipe, request.getSections());
                    
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.APPLICATION_PDF);
                    headers.setContentDispositionFormData("attachment", 
                            recipe.getDrinkName().replaceAll("\\s+", "_") + ".pdf");
                    
                    return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}