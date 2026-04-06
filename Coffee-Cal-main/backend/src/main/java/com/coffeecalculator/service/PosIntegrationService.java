package com.coffeecalculator.service;

import com.coffeecalculator.dto.PosSaleDTO;
import com.coffeecalculator.model.CoffeeShop;
import com.coffeecalculator.model.DailySales;
import com.coffeecalculator.model.Recipe;
import com.coffeecalculator.repository.DailySalesRepository;
import com.coffeecalculator.repository.RecipeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class PosIntegrationService {

    private static final Logger log = LoggerFactory.getLogger(PosIntegrationService.class);
    private final Random random = new Random();

    private final RecipeRepository recipeRepository;
    private final DailySalesRepository dailySalesRepository;

    public PosIntegrationService(RecipeRepository recipeRepository,
                                 DailySalesRepository dailySalesRepository) {
        this.recipeRepository = recipeRepository;
        this.dailySalesRepository = dailySalesRepository;
    }

    /**
     * Mock implementation that simulates fetching sales from external POS API
     * Replace this with actual Square/Clover API calls when you have API keys
     */
    public List<PosSaleDTO> fetchSalesFromPos(CoffeeShop shop, LocalDate date) {
        log.info("Fetching sales for shop {} on date {}", shop.getName(), date);
        
        List<PosSaleDTO> mockSales = new ArrayList<>();
        List<Recipe> recipes = recipeRepository.findByCoffeeShopId(shop.getId());
        
        // Generate mock sales for each recipe that has posItemId
        for (Recipe recipe : recipes) {
            if (recipe.getPosItemId() != null && !recipe.getPosItemId().isBlank()) {
                int quantity = 30 + random.nextInt(70); // 30-99 sales per item
                mockSales.add(new PosSaleDTO(
                    recipe.getPosItemId(),
                    quantity,
                    recipe.getSuggestedSellingPrice(),
                    recipe.getTotalCost()
                ));
            }
        }
        
        log.info("Fetched {} sales records from POS for shop {}", mockSales.size(), shop.getId());
        return mockSales;
    }

    /**
     * Processes POS sales data and saves to DailySales table
     * Idempotent: Will not create duplicate entries for same date/recipe
     */
    @Transactional
    public int processPosSales(CoffeeShop shop, LocalDate date, List<PosSaleDTO> posSales) {
        log.info("Processing {} POS sales for shop {} on {}", posSales.size(), shop.getId(), date);
        
        // Get existing sales for this date to avoid duplicates
        List<DailySales> existingSales = dailySalesRepository
            .findByCoffeeShopIdAndSaleDateBetween(shop.getId(), date, date);
        
        Map<String, DailySales> existingByPosId = existingSales.stream()
            .filter(sale -> sale.getRecipe().getPosItemId() != null)
            .collect(Collectors.toMap(
                sale -> sale.getRecipe().getPosItemId(),
                sale -> sale
            ));

        int processedCount = 0;
        
        for (PosSaleDTO posSale : posSales) {
            Optional<Recipe> recipeOpt = recipeRepository
                .findByCoffeeShopIdAndPosItemId(shop.getId(), posSale.posItemId());
            
            if (recipeOpt.isEmpty()) {
                log.warn("No recipe found for POS item ID: {} - skipping", posSale.posItemId());
                continue;
            }
            
            Recipe recipe = recipeOpt.get();
            
            // Skip if we already have sales for this recipe on this date
            if (existingByPosId.containsKey(posSale.posItemId())) {
                log.debug("Sales already exist for recipe {} on date {} - skipping", recipe.getId(), date);
                continue;
            }
            
            // Create new DailySales record
            DailySales dailySales = new DailySales();
            dailySales.setCoffeeShop(shop);
            dailySales.setRecipe(recipe);
            dailySales.setSaleDate(date);
            dailySales.setQuantitySold(posSale.quantity());
            dailySales.setActualSellingPrice(posSale.unitPrice());
            dailySales.setTotalCostAllocation(posSale.unitCost());
            
            dailySalesRepository.save(dailySales);
            processedCount++;
        }
        
        log.info("Successfully processed {} new sales records for shop {}", processedCount, shop.getId());
        return processedCount;
    }

    /**
     * Convenience method: Fetch and process in one call
     */
    @Transactional
    public int syncPosSalesForDate(CoffeeShop shop, LocalDate date) {
        if (!shop.isPosEnabled()) {
            log.debug("POS sync skipped for shop {} - POS not enabled", shop.getId());
            return 0;
        }
        
        List<PosSaleDTO> sales = fetchSalesFromPos(shop, date);
        return processPosSales(shop, date, sales);
    }
}
