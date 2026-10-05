package com.asecna.pointage.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebAuthnValidationRequest {

    @NotBlank(message = "Le code de l'agent est requis")
    private String agentCode;

    @NotBlank(message = "L'identifiant de session QR est requis")
    private String sessionId;

    @NotBlank(message = "Le jeton QR est requis")
    private String token;

    @Builder.Default
    private String typePointage = "PRISE_DE_SERVICE";

    @NotBlank(message = "Le credentialId WebAuthn est requis")
    private String credentialId;

    @NotBlank(message = "Le clientDataJSON WebAuthn est requis")
    private String clientDataJSON;

    @NotBlank(message = "L'authenticatorData WebAuthn est requis")
    private String authenticatorData;

    @NotBlank(message = "La signature WebAuthn est requise")
    private String signature;

    private String userHandle;

    // Champ manquant nécessaire pour PointageService.java
    private String deviceUuid;
}