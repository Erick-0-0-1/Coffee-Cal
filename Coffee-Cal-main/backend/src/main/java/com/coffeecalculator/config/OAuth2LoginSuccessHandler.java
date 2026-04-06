package com.coffeecalculator.config;

import com.coffeecalculator.model.Role;
import com.coffeecalculator.model.User;
import com.coffeecalculator.security.JwtTokenProvider;
import com.coffeecalculator.service.UserService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Set;

@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;

    public OAuth2LoginSuccessHandler(JwtTokenProvider jwtTokenProvider, UserService userService) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userService = userService;
        setDefaultTargetUrl("http://localhost:5173/dashboard");
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        
        // Create or update user
        if (userService.findByUsername(email).isEmpty()) {
            userService.registerUser(email, email, "oauth2-user-" + System.currentTimeMillis());
        }
        
        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(email)
                .password("")
                .authorities(Set.of(() -> "ROLE_USER"))
                .build();
        
        String token = jwtTokenProvider.generateToken(userDetails);
        
        // Redirect with token
        getRedirectStrategy().sendRedirect(request, response, 
                "http://localhost:5173/auth/social?token=" + token);
        
        clearAuthenticationAttributes(request);
    }
}
