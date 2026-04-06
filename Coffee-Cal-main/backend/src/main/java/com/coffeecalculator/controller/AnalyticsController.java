package com.coffeecalculator.controller;

import com.coffeecalculator.config.TenantContext;
import com.coffeecalculator.dto.DailyRevenueCostDTO;
import com.coffeecalculator.model.CoffeeShop;
import com.coffeecalculator.repository.CoffeeShopRepository;
import com.coffeecalculator.repository.DailySalesRepository;
import com.coffeecalculator.service.PosIntegrationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@PreAuthorize("hasAnyRole('OWNER', 'MANAGER')") // Only Owner and Manager can access
public class AnalyticsController {

    private final DailySalesRepository dailySalesRepository;
    private final CoffeeShopRepository coffeeShopRepository;
    private final PosIntegrationService posIntegrationService;

    public AnalyticsController(DailySalesRepository dailySalesRepository,
                               CoffeeShopRepository coffeeShopRepository,
                               PosIntegrationService posIntegrationService) {
        this.dailySalesRepository = dailySalesRepository;
        this.coffeeShopRepository = coffeeShopRepository;
        this.posIntegrationService = posIntegrationService;
    }

    /**
     * Returns daily revenue vs cost data for last 30 days
     * Secured for OWNER and MANAGER roles only
     */
    @GetMapping("/revenue-cost")
    public ResponseEntity<List<DailyRevenueCostDTO>> getRevenueVsCostLast30Days() {
        Long currentShopId = TenantContext.getCurrentShopId();
        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
        
        List<DailyRevenueCostDTO> data = dailySalesRepository.findRevenueCostByDateRange(
            currentShopId, 
            thirtyDaysAgo
        );
        
        return ResponseEntity.ok(data);
    }

    /**
     * Manual POS sync endpoint - triggers sync for current shop and today's date
     */
    @PostMapping("/sync-pos")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<String> triggerPosSync() {
        Long currentShopId = TenantContext.getCurrentShopId();
        
        return coffeeShopRepository.findById(currentShopId)
            .map(shop -> {
                if (!shop.isPosEnabled()) {
                    return ResponseEntity.badRequest().body("POS integration not enabled for this shop");
                }
                
                int processed = posIntegrationService.syncPosSalesForDate(shop, LocalDate.now());
                return ResponseEntity.ok(String.format("POS sync completed. %d records processed.", processed));
            })
            .orElse(ResponseEntity.badRequest().body("Shop not found"));
    }
}
