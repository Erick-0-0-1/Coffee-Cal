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

    @GetMapping
    public ResponseEntity<List<RecipeDTO>> getAllRecipes() {
        return ResponseEntity.ok(recipeService.getAllRecipes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getRecipeById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(recipeService.getRecipeById(id));
        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Error finding recipe: " + e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> createRecipe(@Valid @RequestBody RecipeDTO recipeDTO) {
        try {
            // FIX: Set Shop ID for the parent recipe
            if (recipeDTO.getShopId() == null) {
                recipeDTO.setShopId(1L); 
            }
            
            // FIX: Set Shop ID for every ingredient attached to this recipe
            if (recipeDTO.getIngredients() != null) {
                recipeDTO.getIngredients().forEach(ingredient -> {
                    if (ingredient.getShopId() == null) {
                        ingredient.setShopId(1L);
                    }
                });
            }
            
            return ResponseEntity.status(HttpStatus.CREATED).body(recipeService.createRecipe(recipeDTO));
        } catch (RuntimeException e) {
            e.printStackTrace(); 
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error saving recipe: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateRecipe(@PathVariable Long id, @Valid @RequestBody RecipeDTO recipeDTO) {
        try {
            // Apply the same fallback here
            if (recipeDTO.getShopId() == null) {
                recipeDTO.setShopId(1L);
            }
            
            if (recipeDTO.getIngredients() != null) {
                recipeDTO.getIngredients().forEach(ingredient -> {
                    if (ingredient.getShopId() == null) {
                        ingredient.setShopId(1L);
                    }
                });
            }
            
            return ResponseEntity.ok(recipeService.updateRecipe(id, recipeDTO));
        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error updating recipe: " + e.getMessage());
        }
    }

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

    @GetMapping("/search")
    public ResponseEntity<List<RecipeDTO>> searchRecipes(@RequestParam String term) {
        return ResponseEntity.ok(recipeService.searchRecipes(term));
    }

    @GetMapping("/price-range")
    public ResponseEntity<List<RecipeDTO>> getRecipesByPriceRange(@RequestParam BigDecimal min, @RequestParam BigDecimal max) {
        return ResponseEntity.ok(recipeService.getRecipesByPriceRange(min, max));
    }

    @PostMapping("/{id}/what-if")
    public ResponseEntity<?> calculateWhatIf(@PathVariable Long id, @RequestParam BigDecimal margin) {
        try {
            return ResponseEntity.ok(recipeService.calculateWhatIfScenario(id, margin));
        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error calculating scenario: " + e.getMessage());
        }
    }

    @GetMapping("/statistics")
    public ResponseEntity<RecipeStatisticsDTO> getStatistics() {
        return ResponseEntity.ok(recipeService.getRecipeStatistics());
    }

    @PostMapping(value = "/{id}/export-pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> exportRecipePdf(@PathVariable Long id, @RequestBody RecipePdfRequest request) {
        return recipeRepository.findById(id)
                .map(recipe -> {
                    byte[] pdfBytes = pdfService.generateRecipePdf(recipe, request.getSections());
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.APPLICATION_PDF);
                    
                    String filename = recipe.getDrinkName().replaceAll("[^a-zA-Z0-9]", "_") + ".pdf";
                    headers.setContentDispositionFormData("attachment", filename);
                    
                    return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}