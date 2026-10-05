package com.asecna.pointage.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebAuthnChallengeResponse {
    private String challenge;     // Base64URL string aléatoire (32 octets)
    private String credentialId;  // Base64URL credential ID enregistré pour l'agent
    private String rpId;          // Relying Party Identifier (domaine ou hostname)
    private long timeout;         // Durée d'expiration en ms (ex: 60000)
    private String userVerification; // "required"
}
