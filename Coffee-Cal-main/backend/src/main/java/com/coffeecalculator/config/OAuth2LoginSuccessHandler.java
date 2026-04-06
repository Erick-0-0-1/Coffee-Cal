package com.coffeecalculator.config;

import com.coffeecalculator.model.User;
import com.coffeecalculator.security.JwtTokenProvider;
import com.coffeecalculator.service.UserService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;

    // ← FIXED: read from application.properties instead of hardcoding localhost
    @Value("${frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public OAuth2LoginSuccessHandler(JwtTokenProvider jwtTokenProvider, UserService userService) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userService = userService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");

        // Save to DB if first OAuth2 login — unchanged, this part was correct
        if (userService.findByUsername(email).isEmpty()) {
            userService.registerUser(email, email, "oauth2-user-" + System.currentTimeMillis());
        }

        // ← FIXED: load the REAL User from the DB so the token gets the actual roles
        //           (ROLE_BARISTA or ROLE_OWNER), not the fake throwaway ROLE_USER
        User realUser = userService.findByUsername(email)
                .orElseThrow(() -> new RuntimeException("User not found after OAuth2 registration: " + email));

        String token = jwtTokenProvider.generateToken(realUser);

        // ← FIXED: redirect to Vercel in production, localhost in dev
        getRedirectStrategy().sendRedirect(request, response,
                frontendUrl + "/auth/social?token=" + token);

        clearAuthenticationAttributes(request);
    }
}