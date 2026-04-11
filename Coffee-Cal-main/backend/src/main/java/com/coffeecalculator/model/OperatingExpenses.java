package com.coffeecalculator.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;


@Entity
@Table(name = "operating_expenses")
@Getter
@Setter
@NoArgsConstructor
public class OperatingExpenses {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

  
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false)
    private CoffeeShop coffeeShop;

    @NotBlank(message = "Expense name is required")
    @Column(nullable = false)
    private String name;

    @NotBlank(message = "Category is required")
    @Column(nullable = false)
    private String category; 

    @NotNull(message = "Monthly amount is required")
    @Positive(message = "Amount must be positive")
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal monthlyAmount; 

    @Column(name = "is_fixed", nullable = false)
    private boolean isFixed = true; 

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(length = 500)
    private String notes;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

  
    @Transient
    public String getCategoryDisplayName() {
        if (this.category == null) return "Unknown";
        
        return switch (this.category.toLowerCase()) {
            case "rent" -> "Rent / Lease";
            case "utilities" -> "Utilities (Electric, Water, Gas)";
            case "labor" -> "Labor / Salaries";
            case "marketing" -> "Marketing / Advertising";
            case "equipment" -> "Equipment / Maintenance";
            case "supplies" -> "General Supplies";
            case "insurance" -> "Insurance";
            case "taxes" -> "Taxes / Permits";
            case "others" -> "Other Expenses";
            default -> "Miscellaneous";
        };
    }

  
    @Transient
    public boolean isValidCategory() {
        if (this.category == null) return false;
        
        return switch (this.category.toLowerCase()) {
            case "rent", "utilities", "labor", "marketing", "equipment", 
                 "supplies", "insurance", "taxes", "others" -> true;
            default -> false;
        };
    }

    @Transient
    public BigDecimal getDailyAmount() {
        if (monthlyAmount == null) return BigDecimal.ZERO;
        // Assuming 30 days per month
        return monthlyAmount.divide(new BigDecimal("30"), 2, RoundingMode.HALF_UP);
    }

  
    @Transient
    public String getExpenseType() {
        return isFixed ? "Fixed Expense" : "Variable Expense";
    }
}
