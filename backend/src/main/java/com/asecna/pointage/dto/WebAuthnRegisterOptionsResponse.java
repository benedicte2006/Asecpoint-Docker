package com.asecna.pointage.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebAuthnRegisterOptionsResponse {
    private String challenge;     // Base64URL string (32 octets)
    private String rpId;          // Hostname / domain
    private String rpName;        // "ASECNA Pointage Sécurisé"
    private String userId;        // Base64URL string de l'ID ou code agent
    private String userName;      // Username de l'agent
    private String userDisplayName; // Nom complet de l'agent
    private long timeout;         // Timeout en ms
    private String attestation;   // "none"
}
