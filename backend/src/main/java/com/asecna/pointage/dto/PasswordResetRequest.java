package com.asecna.pointage.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PasswordResetRequest {
    @NotBlank
    @Size(min = 6, message = "Le mot de passe doit comporter au moins 6 caractères")
    private String newPassword;
}