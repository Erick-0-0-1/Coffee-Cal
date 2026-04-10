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
    public ResponseEntity<RecipeDTO> getRecipeById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(recipeService.getRecipeById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<RecipeDTO> createRecipe(@Valid @RequestBody RecipeDTO recipeDTO) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(recipeService.createRecipe(recipeDTO));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<RecipeDTO> updateRecipe(@PathVariable Long id, @Valid @RequestBody RecipeDTO recipeDTO) {
        try {
            return ResponseEntity.ok(recipeService.updateRecipe(id, recipeDTO));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecipe(@PathVariable Long id) {
        recipeService.deleteRecipe(id);
        return ResponseEntity.noContent().build();
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
    public ResponseEntity<RecipeDTO> calculateWhatIf(@PathVariable Long id, @RequestParam BigDecimal margin) {
        return ResponseEntity.ok(recipeService.calculateWhatIfScenario(id, margin));
    }

    @GetMapping("/statistics")
    public ResponseEntity<RecipeStatisticsDTO> getStatistics() {
        return ResponseEntity.ok(recipeService.getRecipeStatistics());
    }

    @PostMapping("/{id}/export-pdf")
    public ResponseEntity<byte[]> exportRecipePdf(@PathVariable Long id, @RequestBody RecipePdfRequest request) {
        return recipeRepository.findById(id)
                .map(recipe -> {
                    byte[] pdfBytes = pdfService.generateRecipePdf(recipe, request.getSections());
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.APPLICATION_PDF);
                    headers.setContentDispositionFormData("attachment", recipe.getDrinkName().replaceAll("\\s+", "_") + ".pdf");
                    return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}