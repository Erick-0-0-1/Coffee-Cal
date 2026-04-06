package com.coffeecalculator.dto;

import lombok.Getter;
import lombok.Setter;


// Use @Getter/@Setter for boilerplate getters/setters
@Getter
@Setter

public class UserRegistrationRequest {
    private String username;
    private String email;
    private String password;
}
