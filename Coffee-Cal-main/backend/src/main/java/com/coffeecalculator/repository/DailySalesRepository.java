package com.coffeecalculator.repository;

import com.coffeecalculator.dto.DailyRevenueCostDTO;
import com.coffeecalculator.model.DailySales;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DailySalesRepository extends JpaRepository<DailySales, Long> {

   
    @Query("SELECT new com.coffeecalculator.dto.DailyRevenueCostDTO(" +
           "    ds.saleDate, " +
           "    SUM(ds.actualSellingPrice * ds.quantitySold), " +
           "    SUM(ds.totalCostAllocation * ds.quantitySold)" +
           ") " +
           "FROM DailySales ds " +
           "WHERE ds.coffeeShop.id = :shopId " +
           "  AND ds.saleDate >= :startDate " +
           "GROUP BY ds.saleDate " +
           "ORDER BY ds.saleDate ASC")
    List<DailyRevenueCostDTO> findRevenueCostByDateRange(
        @Param("shopId") Long shopId,
        @Param("startDate") LocalDate startDate
    );

    List<DailySales> findByCoffeeShopId(Long shopId);
    List<DailySales> findByCoffeeShopIdAndSaleDateBetween(Long shopId, LocalDate start, LocalDate end);
}
