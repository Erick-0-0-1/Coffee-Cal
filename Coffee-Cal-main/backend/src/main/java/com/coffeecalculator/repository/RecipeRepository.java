package com.coffeecalculator.repository;

import com.coffeecalculator.model.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;


@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Long> {

 
    List<Recipe> findByCoffeeShopId(Long shopId);

  
    @Query("SELECT r FROM Recipe r WHERE r.coffeeShop.id = :shopId ORDER BY r.drinkName ASC")
    List<Recipe> findAllByCoffeeShopIdOrderedByName(Long shopId);

  
    List<Recipe> findByCoffeeShopIdAndDrinkNameContainingIgnoreCase(Long shopId, String drinkName);

  
    boolean existsByCoffeeShopIdAndDrinkNameIgnoreCase(Long shopId, String drinkName);



    @Query("SELECT COUNT(r) FROM Recipe r WHERE r.coffeeShop.id = :shopId")
    long countByCoffeeShopId(Long shopId);


    Optional<Recipe> findByCoffeeShopIdAndPosItemId(Long shopId, String posItemId);

    @Query("SELECT r FROM Recipe r WHERE r.publishedToCommunity = true ORDER BY r.drinkName ASC")
    List<Recipe> findAllPublishedToCommunity();

  
    @Query("SELECT r FROM Recipe r WHERE r.targetMarginPercent BETWEEN :minPrice AND :maxPrice")
    List<Recipe> findByPriceRange(@Param("minPrice") BigDecimal minPrice,
                                  @Param("maxPrice") BigDecimal maxPrice);


   
    boolean existsByDrinkNameIgnoreCase(String drinkName);

   
    @Query("SELECT COUNT(r) FROM Recipe r")
    long countTotalRecipes();


    List<Recipe> findByDrinkNameContainingIgnoreCase(String name);

    @Query("SELECT r FROM Recipe r ORDER BY r.drinkName ASC")
    List<Recipe> findAllOrderedByName();

    @Query(value = "SELECT * FROM recipes ORDER BY created_at DESC LIMIT ?1", nativeQuery = true)
    List<Recipe> findTopNByDate(int n);

    @Query("SELECT COALESCE(AVG(r.targetMarginPercent), 0.0) FROM Recipe r")
    double calculateAverageRating();

    @Query(value = "SELECT created_at FROM recipes ORDER BY created_at DESC LIMIT 1", nativeQuery = true)
    java.time.LocalDateTime findMostRecentActivity();

    @Query("SELECT ri.ingredient.name, COUNT(ri) FROM RecipeIngredient ri GROUP BY ri.ingredient.name")
    List<Object[]> getIngredientUsageCounts();
}