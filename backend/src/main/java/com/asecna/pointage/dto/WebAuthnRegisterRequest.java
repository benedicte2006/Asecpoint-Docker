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
public class WebAuthnRegisterRequest {

    @NotBlank(message = "Le code de l'agent est requis")
    private String agentCode;

    @NotBlank(message = "Le credentialId WebAuthn est requis")
    private String credentialId;

    @NotBlank(message = "La clé publique est requise")
    private String publicKey; // Base64 ou Base64URL du format SPKI X.509 ou bytes de la clé

    private String deviceLabel; // ex: "Samsung Galaxy S24", "iPhone 15"

    private String clientDataJSON;

    private String attestationObject;
}
