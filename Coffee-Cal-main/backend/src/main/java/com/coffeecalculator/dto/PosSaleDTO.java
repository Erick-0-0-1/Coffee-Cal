package com.coffeecalculator.dto;

import java.math.BigDecimal;

public record PosSaleDTO(
    String posItemId,
    Integer quantity,
    BigDecimal unitPrice,
    BigDecimal unitCost
) {}
