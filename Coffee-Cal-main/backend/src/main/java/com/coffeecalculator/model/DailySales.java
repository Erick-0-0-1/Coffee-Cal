package com.coffeecalculator.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_sales")
@Getter
@Setter
@NoArgsConstructor
public class DailySales {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Multi-Tenancy: Each sale belongs to one coffee shop
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false)
    private CoffeeShop coffeeShop;

    // Track which recipe was sold
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    @NotNull(message = "Sale date is required")
    @Column(name = "sale_date", nullable = false)
    private LocalDate saleDate;

    @NotNull(message = "Quantity sold is required")
    @Positive(message = "Quantity must be positive")
    @Column(nullable = false)
    private Integer quantitySold;

    @NotNull(message = "Actual selling price is required")
    @Positive(message = "Selling price must be positive")
    @Column(name = "actual_selling_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal actualSellingPrice;

    @NotNull(message = "Total cost allocation is required")
    @Positive(message = "Cost must be positive")
    @Column(name = "total_cost_allocation", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalCostAllocation;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Calculated convenience methods
    public BigDecimal getTotalRevenue() {
        return actualSellingPrice.multiply(new BigDecimal(quantitySold));
    }

    public BigDecimal getTotalCost() {
        return totalCostAllocation.multiply(new BigDecimal(quantitySold));
    }

    public BigDecimal getProfit() {
        return getTotalRevenue().subtract(getTotalCost());
    }
}
