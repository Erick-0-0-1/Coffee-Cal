package com.coffeecalculator.repository;

import com.coffeecalculator.model.CoffeeShop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CoffeeShopRepository extends JpaRepository<CoffeeShop, Long> {
    boolean existsByNameIgnoreCase(String name);
}
