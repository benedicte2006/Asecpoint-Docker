package com.asecna.pointage.dto;

import com.asecna.pointage.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String matricule;
    private String username;
    private String nom;
    private String prenom;
    private String fonction;
    private Role role;
    private Long uniteId;
    private String uniteNom;
    private boolean active;
    private String deviceUuid;
    private LocalDateTime createdAt;
}
