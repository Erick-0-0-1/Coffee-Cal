package com.coffeecalculator.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
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
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "recipes")
@Getter
@Setter
@NoArgsConstructor
public class Recipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false)
    private CoffeeShop coffeeShop;

    @NotBlank(message = "Recipe name is required")
    @Column(nullable = false)
    private String drinkName;

    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<RecipeIngredient> ingredients = new ArrayList<>();

    @NotNull(message = "Target margin is required")
    @Positive(message = "Target margin must be positive")
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal targetMarginPercent = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal allocatedExpensePerItem = BigDecimal.ZERO;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(length = 1000)
    private String notes;

    @Column(name = "pos_item_id")
    private String posItemId;


    @Column(name = "is_published_to_community", nullable = false)
    private boolean publishedToCommunity = false;

    
    @Column(name = "original_creator_name")
    private String originalCreatorName;

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
    public BigDecimal getTotalCost() {
        if (ingredients == null || ingredients.isEmpty()) return BigDecimal.ZERO;
        
        return ingredients.stream()
                .filter(ri -> ri.getIngredient() != null && ri.getQuantity() != null)
                .map(RecipeIngredient::getLineCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    @Transient
    public BigDecimal getSuggestedSellingPrice() {
        BigDecimal cost = getTotalCost();
        if (cost.compareTo(BigDecimal.ZERO) == 0 || targetMarginPercent == null || targetMarginPercent.compareTo(BigDecimal.ZERO) <= 0) {
            return cost;
        }

        BigDecimal marginDecimal = targetMarginPercent.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
        BigDecimal divisor = BigDecimal.ONE.subtract(marginDecimal);

        return divisor.compareTo(BigDecimal.ZERO) > 0 
                ? cost.divide(divisor, 2, RoundingMode.HALF_UP) 
                : cost;
    }

    @Transient
    public BigDecimal getGrossProfit() {
        return getSuggestedSellingPrice().subtract(getTotalCost()).setScale(2, RoundingMode.HALF_UP);
    }

    @Transient
    public BigDecimal getActualMarginPercent() {
        BigDecimal price = getSuggestedSellingPrice();
        if (price.compareTo(BigDecimal.ZERO) <= 0) return BigDecimal.ZERO;
        
        return getGrossProfit().divide(price, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(2, RoundingMode.HALF_UP);
    }

    @Transient
    public BigDecimal getNetProfit() {
        BigDecimal expense = allocatedExpensePerItem != null ? allocatedExpensePerItem : BigDecimal.ZERO;
        return getGrossProfit().subtract(expense).setScale(2, RoundingMode.HALF_UP);
    }

    @Transient
    public BigDecimal getNetMarginPercent() {
        BigDecimal price = getSuggestedSellingPrice();
        if (price.compareTo(BigDecimal.ZERO) <= 0) return BigDecimal.ZERO;

        return getNetProfit().divide(price, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(2, RoundingMode.HALF_UP);
    }

    @Transient
    public BigDecimal getFinalSellingPrice() {
        BigDecimal totalCostWithOverhead = getTotalCost().add(
                allocatedExpensePerItem != null ? allocatedExpensePerItem : BigDecimal.ZERO
        );

        if (targetMarginPercent == null || targetMarginPercent.compareTo(BigDecimal.ZERO) <= 0) {
            return totalCostWithOverhead;
        }

        BigDecimal marginDecimal = targetMarginPercent.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
        BigDecimal divisor = BigDecimal.ONE.subtract(marginDecimal);

        return divisor.compareTo(BigDecimal.ZERO) > 0 
                ? totalCostWithOverhead.divide(divisor, 2, RoundingMode.HALF_UP) 
                : totalCostWithOverhead;
    }

  
    public void addIngredient(RecipeIngredient recipeIngredient) {
        if (recipeIngredient != null && recipeIngredient.getIngredient() != null) {
            ingredients.add(recipeIngredient);
            recipeIngredient.setRecipe(this);
        }
    }

    public void removeIngredient(RecipeIngredient recipeIngredient) {
        if (recipeIngredient != null) {
            ingredients.remove(recipeIngredient);
            recipeIngredient.setRecipe(null);
        }
    }

    @Transient
    public String getComplexityLevel() {
        int count = ingredients != null ? ingredients.size() : 0;
        return switch (count) {
            case 0, 1, 2 -> "Simple";
            case 3, 4, 5 -> "Moderate";
            case 6, 7, 8 -> "Complex";
            default -> "Very Complex";
        };
    }

    @Transient
    public boolean isComplete() {
        return drinkName != null && !drinkName.trim().isEmpty() &&
               ingredients != null && !ingredients.isEmpty() &&
               targetMarginPercent != null && targetMarginPercent.compareTo(BigDecimal.ZERO) > 0;
    }

    @Transient
    public String getProfitabilityStatus() {
        BigDecimal margin = getNetMarginPercent();
        if (margin.compareTo(BigDecimal.ZERO) <= 0) return "Unprofitable";
        if (margin.compareTo(new BigDecimal("10")) < 0) return "Low Profit";
        if (margin.compareTo(new BigDecimal("20")) < 0) return "Moderate Profit";
        if (margin.compareTo(new BigDecimal("30")) < 0) return "Good Profit";
        return "Excellent Profit";
    }

    @Transient
    public String getPricingCategory() {
        BigDecimal price = getFinalSellingPrice();
        if (price.compareTo(new BigDecimal("100")) < 0) return "Budget";
        if (price.compareTo(new BigDecimal("150")) < 0) return "Standard";
        if (price.compareTo(new BigDecimal("200")) < 0) return "Premium";
        return "Luxury";
    }

    public void calculateCosts() {
        // Logic to sum up ingredients and set total cost
    }
}
