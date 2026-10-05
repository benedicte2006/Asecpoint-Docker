package com.asecna.pointage.dto;

import com.asecna.pointage.entity.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCreateRequest {
    @NotBlank
    private String matricule;

    @NotBlank
    private String username;

    @NotBlank
    private String password;

    @NotBlank
    private String nom;

    @NotBlank
    private String prenom;

    private String fonction;

    @NotNull
    private Role role;

    private Long uniteId;

    private String deviceUuid;
}
