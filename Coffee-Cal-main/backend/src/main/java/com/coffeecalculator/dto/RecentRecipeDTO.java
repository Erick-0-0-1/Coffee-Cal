package com.coffeecalculator.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecentRecipeDTO {
    private Long id;
    private String title;
    private String primaryIngredient;
    private Double averageRating;
    private LocalDateTime publishedDate;
}
