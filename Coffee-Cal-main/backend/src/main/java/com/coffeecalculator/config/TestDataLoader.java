package com.coffeecalculator.config;

import com.coffeecalculator.model.CoffeeShop;
import com.coffeecalculator.model.DailySales;
import com.coffeecalculator.model.Recipe;
import com.coffeecalculator.model.Role;
import com.coffeecalculator.model.User;
import com.coffeecalculator.repository.CoffeeShopRepository;
import com.coffeecalculator.repository.DailySalesRepository;
import com.coffeecalculator.repository.RecipeRepository;
import com.coffeecalculator.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Random;
import java.util.Set;

@Component
public class TestDataLoader implements CommandLineRunner {

    private final CoffeeShopRepository coffeeShopRepository;
    private final UserRepository userRepository;
    private final RecipeRepository recipeRepository;
    private final DailySalesRepository dailySalesRepository;
    private final PasswordEncoder passwordEncoder;
    private final Random random = new Random();

    public TestDataLoader(CoffeeShopRepository coffeeShopRepository,
                          UserRepository userRepository,
                          RecipeRepository recipeRepository,
                          DailySalesRepository dailySalesRepository,
                          PasswordEncoder passwordEncoder) {
        this.coffeeShopRepository = coffeeShopRepository;
        this.userRepository = userRepository;
        this.recipeRepository = recipeRepository;
        this.dailySalesRepository = dailySalesRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Only load test data if database is empty
        if (coffeeShopRepository.count() == 0) {
            // 1. Create default Coffee Shop
            CoffeeShop defaultShop = new CoffeeShop();
            defaultShop.setName("Demo Coffee Shop");
            defaultShop.setEmail("demo@coffeeshop.com");
            defaultShop.setPhone("+1-555-123-4567");
            defaultShop.setAddress("123 Main Street, Coffee City");
            defaultShop.setCurrency("PHP");
            defaultShop.setTimezone("Asia/Manila");
            coffeeShopRepository.save(defaultShop);

            // 2. Create OWNER user
            if (!userRepository.existsByUsername("owner")) {
                User owner = new User();
                owner.setUsername("owner");
                owner.setEmail("owner@coffeeshop.com");
                owner.setPasswordHash(passwordEncoder.encode("owner123"));
                owner.setCoffeeShop(defaultShop);
                owner.setRoles(Set.of(Role.OWNER));
                userRepository.save(owner);
            }

            // 3. Create BARISTA user
            if (!userRepository.existsByUsername("barista")) {
                User barista = new User();
                barista.setUsername("barista");
                barista.setEmail("barista@coffeeshop.com");
                barista.setPasswordHash(passwordEncoder.encode("barista123"));
                barista.setCoffeeShop(defaultShop);
                barista.setRoles(Set.of(Role.BARISTA));
                userRepository.save(barista);
            }

            // 4. Create MANAGER user
            if (!userRepository.existsByUsername("manager")) {
                User manager = new User();
                manager.setUsername("manager");
                manager.setEmail("manager@coffeeshop.com");
                manager.setPasswordHash(passwordEncoder.encode("manager123"));
                manager.setCoffeeShop(defaultShop);
                manager.setRoles(Set.of(Role.MANAGER));
                userRepository.save(manager);
            }

            // Create sample recipe if none exists
            if (recipeRepository.count() == 0) {
                Recipe sampleRecipe = new Recipe();
                sampleRecipe.setDrinkName("Espresso");
                sampleRecipe.setTargetMarginPercent(new BigDecimal("30.00"));
                sampleRecipe.setAllocatedExpensePerItem(new BigDecimal("5.00"));
                sampleRecipe.setCoffeeShop(defaultShop);
                sampleRecipe.setPosItemId("ITEM-ESPRESSO-001"); // POS mapping
                recipeRepository.save(sampleRecipe);
                
                Recipe latteRecipe = new Recipe();
                latteRecipe.setDrinkName("Cafe Latte");
                latteRecipe.setTargetMarginPercent(new BigDecimal("35.00"));
                latteRecipe.setAllocatedExpensePerItem(new BigDecimal("8.00"));
                latteRecipe.setCoffeeShop(defaultShop);
                latteRecipe.setPosItemId("ITEM-LATTE-002"); // POS mapping
                latteRecipe.setPublishedToCommunity(true); // Publish to community
                recipeRepository.save(latteRecipe);
                
                // Enable POS for demo shop
                defaultShop.setPosEnabled(true);
                defaultShop.setPosProvider("MOCK_SQUARE");
                coffeeShopRepository.save(defaultShop);
                
                // Generate 30 days of sample sales data
                generateSampleSalesData(defaultShop, sampleRecipe);
            }

            System.out.println("==================================================");
            System.out.println("TEST DATA LOADED SUCCESSFULLY");
            System.out.println("");
            System.out.println("OWNER:  username=owner,  password=owner123");
            System.out.println("MANAGER: username=manager, password=manager123");
            System.out.println("BARISTA: username=barista, password=barista123");
            System.out.println("SAMPLE SALES DATA: Generated 30 days of history");
            System.out.println("==================================================");
        }
    }

    private void generateSampleSalesData(CoffeeShop shop, Recipe recipe) {
        LocalDate today = LocalDate.now();
        for (int i = 0; i < 30; i++) {
            LocalDate saleDate = today.minusDays(i);
            
            DailySales sales = new DailySales();
            sales.setCoffeeShop(shop);
            sales.setRecipe(recipe);
            sales.setSaleDate(saleDate);
            sales.setQuantitySold(50 + random.nextInt(50)); // 50-99 sales per day
            sales.setActualSellingPrice(new BigDecimal("120.00"));
            sales.setTotalCostAllocation(new BigDecimal("45.00"));
            
            dailySalesRepository.save(sales);
        }
    }
}
