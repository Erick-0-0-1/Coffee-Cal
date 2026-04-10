package com.coffeecalculator.controller;

import com.coffeecalculator.dto.RecipeDTO;
import com.coffeecalculator.dto.RecipeStatisticsDTO;
import com.coffeecalculator.dto.RecipePdfRequest;
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

@RestController
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "${cors.allowed-origins}"})
public class RecipeController {

    private final RecipeService recipeService;
    private final RecipeRepository recipeRepository;
    private final PdfService pdfService;

    /**
     * Get all recipes
     */
    @GetMapping
    public ResponseEntity<List<RecipeDTO>> getAllRecipes() {
        return ResponseEntity.ok(recipeService.getAllRecipes());
    }

    /**
     * Get a single recipe by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getRecipeById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(recipeService.getRecipeById(id));
        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Error finding recipe: " + e.getMessage());
        }
    }

    /**
     * Create a new recipe
     */
    @PostMapping
    public ResponseEntity<?> createRecipe(@Valid @RequestBody RecipeDTO recipeDTO) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(recipeService.createRecipe(recipeDTO));
        } catch (RuntimeException e) {
            // Prints to Render logs
            e.printStackTrace(); 
            // Sends exact error to the Chrome Response tab
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error saving recipe: " + e.getMessage());
        }
    }

    /**
     * Update an existing recipe
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateRecipe(@PathVariable Long id, @Valid @RequestBody RecipeDTO recipeDTO) {
        try {
            return ResponseEntity.ok(recipeService.updateRecipe(id, recipeDTO));
        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error updating recipe: " + e.getMessage());
        }
    }

    /**
     * Delete a recipe
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRecipe(@PathVariable Long id) {
        try {
            recipeService.deleteRecipe(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error deleting recipe: " + e.getMessage());
        }
    }

    /**
     * Search recipes by name
     */
    @GetMapping("/search")
    public ResponseEntity<List<RecipeDTO>> searchRecipes(@RequestParam String term) {
        return ResponseEntity.ok(recipeService.searchRecipes(term));
    }

    /**
     * Get recipes within a specific price range
     */
    @GetMapping("/price-range")
    public ResponseEntity<List<RecipeDTO>> getRecipesByPriceRange(@RequestParam BigDecimal min, @RequestParam BigDecimal max) {
        return ResponseEntity.ok(recipeService.getRecipesByPriceRange(min, max));
    }

    /**
     * Calculate "What-If" scenario for pricing
     */
    @PostMapping("/{id}/what-if")
    public ResponseEntity<?> calculateWhatIf(@PathVariable Long id, @RequestParam BigDecimal margin) {
        try {
            return ResponseEntity.ok(recipeService.calculateWhatIfScenario(id, margin));
        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error calculating scenario: " + e.getMessage());
        }
    }

    /**
     * Get aggregated recipe statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<RecipeStatisticsDTO> getStatistics() {
        return ResponseEntity.ok(recipeService.getRecipeStatistics());
    }

    /**
     * Export recipe details to PDF
     */
    @PostMapping(value = "/{id}/export-pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> exportRecipePdf(@PathVariable Long id, @RequestBody RecipePdfRequest request) {
        return recipeRepository.findById(id)
                .map(recipe -> {
                    byte[] pdfBytes = pdfService.generateRecipePdf(recipe, request.getSections());
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.APPLICATION_PDF);
                    
                    // Sanitize drink name for filename
                    String filename = recipe.getDrinkName().replaceAll("[^a-zA-Z0-9]", "_") + ".pdf";
                    headers.setContentDispositionFormData("attachment", filename);
                    
                    return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}