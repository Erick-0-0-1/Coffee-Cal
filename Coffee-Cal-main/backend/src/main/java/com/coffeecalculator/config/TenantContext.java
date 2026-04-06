package com.coffeecalculator.config;

/**
 * Thread-local storage for current tenant (Coffee Shop) context
 * This ensures each request has its own shop_id context
 */
public final class TenantContext {

    private TenantContext() {}

    private static final ThreadLocal<Long> CURRENT_SHOP_ID = new ThreadLocal<>();

    public static void setCurrentShopId(Long shopId) {
        CURRENT_SHOP_ID.set(shopId);
    }

    public static Long getCurrentShopId() {
        return CURRENT_SHOP_ID.get();
    }

    public static void clear() {
        CURRENT_SHOP_ID.remove();
    }
}
