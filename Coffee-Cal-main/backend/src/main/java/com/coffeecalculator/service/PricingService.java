package com.coffeecalculator.service;

import com.coffeecalculator.model.Recipe;
import com.coffeecalculator.repository.OperatingExpenseRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class PricingService {

    private final OperatingExpenseRepository expenseRepository;

    @Value("${coffeecalc.business.estimated-monthly-cups:3000}")
    private BigDecimal estimatedMonthlyCups;

    public PricingService(OperatingExpenseRepository expenseRepository) {
        this.expenseRepository = expenseRepository;
    }

    /**
     * Calculates the exact overhead cost to apply to a single drink.
     * Formula: Total Monthly Operating Expenses / Estimated Monthly Drinks Sold
     */
    public BigDecimal calculateOverheadPerDrink() {
        BigDecimal totalExpenses = expenseRepository.getTotalMonthlyExpenses();

        if (totalExpenses == null || totalExpenses.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        return totalExpenses.divide(estimatedMonthlyCups, 4, RoundingMode.HALF_UP)
                .setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Applies live overhead calculation to a recipe
     * This is what enables true live pricing across the entire system
     */
    public Recipe applyLivePricing(Recipe recipe) {
        if (recipe != null) {
            BigDecimal overhead = calculateOverheadPerDrink();
            recipe.setAllocatedExpensePerItem(overhead);
        }
        return recipe;
    }
}
