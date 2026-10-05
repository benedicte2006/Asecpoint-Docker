package com.asecna.pointage.dto;

import com.asecna.pointage.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private Long id;
    private String matricule;
    private String username;
    private String nom;
    private String prenom;
    private Role role;
    private String uniteNom;
    private Long uniteId;
    private String deviceUuid;
}
