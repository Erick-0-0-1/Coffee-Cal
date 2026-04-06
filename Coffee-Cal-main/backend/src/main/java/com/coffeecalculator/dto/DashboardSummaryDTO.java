package com.coffeecalculator.dto;

import java.math.BigDecimal;

public class DashboardSummaryDTO {
    private BigDecimal totalRevenue;
    private BigDecimal totalCost;
    private BigDecimal totalProfit;
    private long recipeCount;

    public DashboardSummaryDTO(BigDecimal totalRevenue, BigDecimal totalCost, BigDecimal totalProfit, long recipeCount) {
        this.totalRevenue = totalRevenue;
        this.totalCost = totalCost;
        this.totalProfit = totalProfit;
        this.recipeCount = recipeCount;
    }

    // Getters
    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public BigDecimal getTotalCost() { return totalCost; }
    public BigDecimal getTotalProfit() { return totalProfit; }
    public long getRecipeCount() { return recipeCount; }

    // Setters
    public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }
    public void setTotalCost(BigDecimal totalCost) { this.totalCost = totalCost; }
    public void setTotalProfit(BigDecimal totalProfit) { this.totalProfit = totalProfit; }
    public void setRecipeCount(long recipeCount) { this.recipeCount = recipeCount; }
}
