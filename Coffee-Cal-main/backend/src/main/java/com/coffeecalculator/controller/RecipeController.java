package com.coffeecalculator.controller;

import com.coffeecalculator.dto.RecipeDTO;
import com.coffeecalculator.dto.RecipeStatisticsDTO; // Normal import now
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

    // ... other endpoints (getAll, create, etc.) ...

    @GetMapping("/statistics")
    public ResponseEntity<RecipeStatisticsDTO> getStatistics() {
        return ResponseEntity.ok(recipeService.getRecipeStatistics());
    }

    // ... exportPdf ...
}