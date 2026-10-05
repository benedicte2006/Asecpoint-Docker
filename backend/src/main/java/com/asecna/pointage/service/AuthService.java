package com.asecna.pointage.service;

import com.asecna.pointage.config.JwtService;
import com.asecna.pointage.dto.AuthRequest;
import com.asecna.pointage.dto.AuthResponse;
import com.asecna.pointage.entity.User;
import com.asecna.pointage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthResponse authenticate(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadCredentialsException("Identifiants incorrects"));

        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole().name());
        claims.put("nomComplet", user.getNom() + " " + user.getPrenom());
        claims.put("matricule", user.getMatricule());
        if (user.getUnite() != null) {
            claims.put("unite", user.getUnite().getNom());
            claims.put("uniteId", user.getUnite().getId());
        }

        String token = jwtService.generateToken(claims, user);

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .matricule(user.getMatricule())
                .username(user.getUsername())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .role(user.getRole())
                .uniteNom(user.getUnite() != null ? user.getUnite().getNom() : null)
                .uniteId(user.getUnite() != null ? user.getUnite().getId() : null)
                .deviceUuid(user.getDeviceUuid())
                .build();
    }
}
