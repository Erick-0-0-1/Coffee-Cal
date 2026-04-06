package com.coffeecalculator.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class OtpRequest {
    private String email;
    private String otp;
    private String username;
    private String password;
}

