package com.coffeecalculator.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DailyRevenueCostDTO(
    LocalDate saleDate,
    BigDecimal totalRevenue,
    BigDecimal totalCost
) {}
