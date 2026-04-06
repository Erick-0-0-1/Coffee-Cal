package com.coffeecalculator.repository;

import com.coffeecalculator.model.OperatingExpenses;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface OperatingExpenseRepository extends JpaRepository<OperatingExpenses, Long> {

    // ==============================================
    // MULTI-TENANCY FILTERS
    // ==============================================

    List<OperatingExpenses> findByCoffeeShopId(Long shopId);

    List<OperatingExpenses> findByCoffeeShopIdAndCategory(Long shopId, String category);

    List<OperatingExpenses> findByCoffeeShopIdAndIsFixed(Long shopId, boolean isFixed);

    @Query("SELECT SUM(e.monthlyAmount) FROM OperatingExpenses e WHERE e.coffeeShop.id = :shopId")
    BigDecimal getTotalMonthlyExpensesByCoffeeShopId(Long shopId);

    @Query("SELECT DISTINCT e.category FROM OperatingExpenses e WHERE e.coffeeShop.id = :shopId ORDER BY e.category")
    List<String> findAllDistinctCategoriesByCoffeeShopId(Long shopId);

    // ==============================================
    // LEGACY METHODS
    // ==============================================
    @Deprecated
    List<OperatingExpenses> findByCategory(String category);
    @Deprecated
    List<OperatingExpenses> findByIsFixed(boolean isFixed);
    @Deprecated
    @Query("SELECT SUM(e.monthlyAmount) FROM OperatingExpenses e")
    BigDecimal getTotalMonthlyExpenses();
    @Deprecated
    @Query("SELECT DISTINCT e.category FROM OperatingExpenses e ORDER BY e.category")
    List<String> findAllDistinctCategories();
}