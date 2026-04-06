package com.coffeecalculator;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling // Enables @Scheduled cron jobs
public class CoffeeCostingCalculatorApplication {
    public static void main(String[] args) {
        SpringApplication.run(CoffeeCostingCalculatorApplication.class, args);
    }
}