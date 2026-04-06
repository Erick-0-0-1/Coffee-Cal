package com.coffeecalculator.service;

import com.coffeecalculator.model.Recipe;
import com.coffeecalculator.repository.OperatingExpenseRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class ExpenseAllocationService {

    private final OperatingExpenseRepository expenseRepository;
    
    // Default monthly production estimate (10,000 drinks)
    private static final BigDecimal DEFAULT_MONTHLY_VOLUME = new BigDecimal("10000");

    public ExpenseAllocationService(OperatingExpenseRepository expenseRepository) {
        this.expenseRepository = expenseRepository;
    }

    /**
     * Calculates allocated expense per drink based on total monthly expenses
     * Uses default volume of 10,000 drinks per month
     */
    public BigDecimal calculateAllocatedExpensePerItem() {
        return calculateAllocatedExpensePerItem(DEFAULT_MONTHLY_VOLUME);
    }

    /**
     * Calculates allocated expense per drink based on custom monthly volume
     */
    public BigDecimal calculateAllocatedExpensePerItem(BigDecimal monthlyVolume) {
        BigDecimal totalMonthlyExpenses = expenseRepository.getTotalMonthlyExpenses();
        
        if (totalMonthlyExpenses == null || totalMonthlyExpenses.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        
        if (monthlyVolume == null || monthlyVolume.compareTo(BigDecimal.ZERO) <= 0) {
            monthlyVolume = DEFAULT_MONTHLY_VOLUME;
        }

        return totalMonthlyExpenses
                .divide(monthlyVolume, 4, RoundingMode.HALF_UP)
                .setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Applies expense allocation to a recipe and returns the final selling price
     * Integrates with Recipe's live pricing calculations
     */
    public BigDecimal calculateFinalRecipePrice(Recipe recipe) {
        BigDecimal allocatedExpense = calculateAllocatedExpensePerItem();
        recipe.setAllocatedExpensePerItem(allocatedExpense);
        return recipe.getFinalSellingPrice();
    }

    /**
     * Gets total monthly operating expenses
     */
    public BigDecimal getTotalMonthlyExpenses() {
        BigDecimal total = expenseRepository.getTotalMonthlyExpenses();
        return total != null ? total : BigDecimal.ZERO;
    }

    /**
     * Gets daily operating expenses
     */
    public BigDecimal getDailyExpenses() {
        BigDecimal monthlyTotal = getTotalMonthlyExpenses();
        return monthlyTotal.divide(new BigDecimal("30"), 2, RoundingMode.HALF_UP);
    }
}
