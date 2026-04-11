package com.coffeecalculator.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;


@Entity
@Table(name = "business_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BusinessSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Expected monthly sales is required")
    @Positive(message = "Expected monthly sales must be positive")
    @Column(nullable = false)
    private Integer expectedMonthlySales; 
    @NotNull(message = "Working days per month is required")
    @Positive(message = "Working days must be positive")
    @Column(nullable = false)
    private Integer workingDaysPerMonth = 26; 
    @Column(nullable = false)
    private BigDecimal totalMonthlyExpenses = BigDecimal.ZERO; 
    @Column(nullable = false)
    private BigDecimal expensePerItem = BigDecimal.ZERO;
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

 
    public void calculateExpensePerItem() {
       
        if (expectedMonthlySales != null && expectedMonthlySales > 0 &&
                totalMonthlyExpenses != null) {

           
            this.expensePerItem = totalMonthlyExpenses.divide(
                    new BigDecimal(expectedMonthlySales),
                    4,
                    java.math.RoundingMode.HALF_UP
            );
        } else {
            this.expensePerItem = BigDecimal.ZERO;
        }
    }

    
    public BigDecimal getDailyExpense() {
        if (workingDaysPerMonth > 0) {
            return totalMonthlyExpenses.divide(
                    new BigDecimal(workingDaysPerMonth),
                    2,
                    java.math.RoundingMode.HALF_UP
            );
        }
        return BigDecimal.ZERO;
    }

   
    public Integer getExpectedDailySales() {
        if (workingDaysPerMonth > 0) {
            return expectedMonthlySales / workingDaysPerMonth;
        }
        return 0;
    }

    
    public Integer getBreakEvenUnits(BigDecimal averageNetProfitPerItem) {
       
        if (averageNetProfitPerItem != null &&
                averageNetProfitPerItem.compareTo(BigDecimal.ZERO) > 0) {

            return totalMonthlyExpenses
                    .divide(averageNetProfitPerItem, 0, java.math.RoundingMode.CEILING)
                    .intValue();
        }
        return 0;
    }
}
