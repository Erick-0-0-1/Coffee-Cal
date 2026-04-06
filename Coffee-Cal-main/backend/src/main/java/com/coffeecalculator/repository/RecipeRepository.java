package com.coffeecalculator.repository;

import com.coffeecalculator.model.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Repository for Recipe entity
 * Provides database operations for recipes
 */
@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    // ==============================================
    // MULTI-TENANCY FILTERS - ALWAYS USE THESE!
    // ==============================================

    /**
     * Find all recipes for a specific coffee shop
     */
    List<Recipe> findByCoffeeShopId(Long shopId);

    /**
     * Find all recipes for a specific coffee shop ordered by name
     */
    @Query("SELECT r FROM Recipe r WHERE r.coffeeShop.id = :shopId ORDER BY r.drinkName ASC")
    List<Recipe> findAllByCoffeeShopIdOrderedByName(Long shopId);

    /**
     * Find recipes by drink name containing (case-insensitive) for a specific shop
     */
    List<Recipe> findByCoffeeShopIdAndDrinkNameContainingIgnoreCase(Long shopId, String drinkName);

    /**
     * Check if recipe name exists for a specific shop
     */
    boolean existsByCoffeeShopIdAndDrinkNameIgnoreCase(Long shopId, String drinkName);

    // ==============================================
    // EXISTING METHODS (UPDATED FOR MULTI-TENANCY)
    // ==============================================

//    @Query("SELECT r FROM Recipe r WHERE r.coffeeShop.id = :shopId AND r.suggestedSellingPrice BETWEEN :minPrice AND :maxPrice")
//    List<Recipe> findByCoffeeShopIdAndPriceRange(
//        @Param("shopId") Long shopId,
//        @Param("minPrice") BigDecimal minPrice,
//        @Param("maxPrice") BigDecimal maxPrice
//    );

//    @Query("SELECT r FROM Recipe r WHERE r.coffeeShop.id = :shopId AND r.actualMarginPercent >= :minMargin")
//    List<Recipe> findByCoffeeShopIdAndMinimumMargin(
//        @Param("shopId") Long shopId,
//        @Param("minMargin") BigDecimal minMargin
//    );

    @Query("SELECT COUNT(r) FROM Recipe r WHERE r.coffeeShop.id = :shopId")
    long countByCoffeeShopId(Long shopId);

//    @Query("SELECT AVG(r.targetMarginPercent) FROM Recipe r WHERE r.coffeeShop.id = :shopId")
//    BigDecimal calculateAvgSellingPrice(@org.springframework.data.repository.query.Param("shopId") Long shopId);

    // POS Integration: Find recipe by external POS item ID
    Optional<Recipe> findByCoffeeShopIdAndPosItemId(Long shopId, String posItemId);

    // Community Market: Find all published recipes (cross-tenant, no shop filter)
    // Custom query explicitly bypasses tenant filtering
    @Query("SELECT r FROM Recipe r WHERE r.publishedToCommunity = true ORDER BY r.drinkName ASC")
    List<Recipe> findAllPublishedToCommunity();

//    /**
//     * Find recipes with selling price in range
//     */
//    @Query("SELECT r FROM Recipe r WHERE r.suggestedSellingPrice BETWEEN :minPrice AND :maxPrice")
//    List<Recipe> findByPriceRange(@Param("minPrice") BigDecimal minPrice,
//                                  @Param("maxPrice") BigDecimal maxPrice);

//    /**
//     * Find recipes with margin greater than specified
//     */
//    @Query("SELECT r FROM Recipe r WHERE r.actualMarginPercent >= :minMargin")
//    List<Recipe> findByMinimumMargin(@Param("minMargin") BigDecimal minMargin);

    /**
     * Check if recipe name exists
     */
    boolean existsByDrinkNameIgnoreCase(String drinkName);

    /**
     * Get total number of recipes
     */
    @Query("SELECT COUNT(r) FROM Recipe r")
    long countTotalRecipes();

//    /**
//     * Get average selling price across all recipes
//     */
//    @Query("SELECT AVG(r.suggestedSellingPrice) FROM Recipe r")
//    BigDecimal getAverageSellingPrice();

    List<Recipe> findByDrinkNameContainingIgnoreCase(String name);

    @Query("SELECT r FROM Recipe r ORDER BY r.drinkName ASC")
    List<Recipe> findAllOrderedByName();

    @Query(value = "SELECT * FROM recipes ORDER BY created_at DESC LIMIT ?1", nativeQuery = true)
    List<Recipe> findTopNByDate(int n);

    double calculateAverageRating();

    @Query(value = "SELECT created_at FROM recipes ORDER BY created_at DESC LIMIT 1", nativeQuery = true)
    java.time.LocalDateTime findMostRecentActivity();

    @Query("SELECT ri.ingredient.name, COUNT(ri) FROM RecipeIngredient ri GROUP BY ri.ingredient.name")
    List<Object[]> getIngredientUsageCounts();
}