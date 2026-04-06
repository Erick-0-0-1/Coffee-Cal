package com.coffeecalculator.model;

public enum Role {
    ADMIN,
    USER,
    OWNER,    // Full access - can do everything
    MANAGER,  // Can manage recipes, ingredients, view sales
    BARISTA   // Can only view recipes
}
