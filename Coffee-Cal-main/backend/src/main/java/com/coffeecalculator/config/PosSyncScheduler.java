package com.coffeecalculator.config;

import com.coffeecalculator.model.CoffeeShop;
import com.coffeecalculator.repository.CoffeeShopRepository;
import com.coffeecalculator.service.PosIntegrationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class PosSyncScheduler {

    private static final Logger log = LoggerFactory.getLogger(PosSyncScheduler.class);

    private final CoffeeShopRepository coffeeShopRepository;
    private final PosIntegrationService posIntegrationService;

    public PosSyncScheduler(CoffeeShopRepository coffeeShopRepository,
                            PosIntegrationService posIntegrationService) {
        this.coffeeShopRepository = coffeeShopRepository;
        this.posIntegrationService = posIntegrationService;
    }

    /**
     * Automatic nightly POS sync - runs every day at 11:50 PM
     * Cron expression: second minute hour day month weekday
     */
    @Scheduled(cron = "0 50 23 * * *")
    public void runNightlyPosSync() {
        log.info("Starting nightly POS sync job");
        
        LocalDate today = LocalDate.now();
        List<CoffeeShop> activeShops = coffeeShopRepository.findAll().stream()
            .filter(CoffeeShop::isActive)
            .filter(CoffeeShop::isPosEnabled)
            .toList();

        log.info("Found {} active shops with POS enabled", activeShops.size());

        int totalRecordsProcessed = 0;
        for (CoffeeShop shop : activeShops) {
            try {
                int processed = posIntegrationService.syncPosSalesForDate(shop, today);
                totalRecordsProcessed += processed;
            } catch (Exception e) {
                log.error("Failed to sync POS for shop {}: {}", shop.getId(), e.getMessage(), e);
            }
        }

        log.info("Nightly POS sync completed. Total records processed: {}", totalRecordsProcessed);
    }
}
