package com.asecna.pointage.config;

import com.asecna.pointage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserRepository userRepository;

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé: " + username));
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService());
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthFilter jwtAuthFilter) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/qr-session/**").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        
                        // Cahier de Marche : Agents et Admins peuvent lire et créer des entrées
                        .requestMatchers(HttpMethod.GET, "/cahier-de-marche/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/cahier-de-marche/**").authenticated()
                        // Cahier de Marche : Seuls les admins peuvent modifier ou supprimer
                        .requestMatchers(HttpMethod.PUT, "/cahier-de-marche/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_UNIT_ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/cahier-de-marche/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_UNIT_ADMIN")

                        // WebAuthn : Réinitialisation administrative sécurisée
                        .requestMatchers(HttpMethod.DELETE, "/pointage/webauthn/reset/**").hasAuthority("ROLE_ADMIN")
                        // WebAuthn : Challenge et validation ouverts (sécurisés cryptographiquement par clé asymétrique et QR session)
                        .requestMatchers("/pointage/webauthn/**").permitAll()

                        // Pointage standard : Authentifié (Agents & Admins)
                        .requestMatchers("/pointage/**").authenticated()

                        // Profil & Modification des identifiants : Authentifié
                        .requestMatchers("/profile/**").authenticated()

                        // Administration : Seul ADMIN a tous les droits de création/suppression
                        .requestMatchers("/admin/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_UNIT_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/unites/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/unites/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/unites/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/unites/**").authenticated()

                        // Tout autre requête doit être authentifiée
                        .anyRequest().authenticated()
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
