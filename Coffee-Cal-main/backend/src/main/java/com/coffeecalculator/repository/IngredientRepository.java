package com.coffeecalculator.repository;

import com.coffeecalculator.model.Ingredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface IngredientRepository extends JpaRepository<Ingredient, Long> {

 

    List<Ingredient> findByCoffeeShopId(Long shopId);

    List<Ingredient> findByCoffeeShopIdAndCategory(Long shopId, String category);

    List<Ingredient> findByCoffeeShopIdAndNameContainingIgnoreCase(Long shopId, String name);

    @Query("SELECT i FROM Ingredient i WHERE i.coffeeShop.id = :shopId ORDER BY i.category ASC, i.name ASC")
    List<Ingredient> findAllByCoffeeShopIdOrderedByCategoryAndName(Long shopId);

    List<Ingredient> findByCoffeeShopIdAndBaseUnit(Long shopId, String baseUnit);

    boolean existsByCoffeeShopIdAndNameIgnoreCase(Long shopId, String name);

    @Query("SELECT DISTINCT i.category FROM Ingredient i WHERE i.coffeeShop.id = :shopId ORDER BY i.category")
    List<String> findAllDistinctCategoriesByCoffeeShopId(Long shopId);


    @Deprecated
    List<Ingredient> findByCategory(String category);
    @Deprecated
    List<Ingredient> findByNameContainingIgnoreCase(String name);
    @Deprecated
    @Query("SELECT i FROM Ingredient i ORDER BY i.category ASC, i.name ASC")
    List<Ingredient> findAllOrderedByCategoryAndName();
    @Deprecated
    List<Ingredient> findByBaseUnit(String baseUnit);
    @Deprecated
    boolean existsByNameIgnoreCase(String name);
    @Deprecated
    @Query("SELECT DISTINCT i.category FROM Ingredient i ORDER BY i.category")
    List<String> findAllDistinctCategories();
}