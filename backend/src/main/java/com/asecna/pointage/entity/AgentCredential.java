package com.asecna.pointage.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "agent_credentials")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgentCredential {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "agent_code", nullable = false, length = 50)
    private String agentCode; // Correspond au matricule ou au username de l'agent (ex: "ASEC-2026-001" ou "agent.twr")

    @Column(name = "credential_id", nullable = false, unique = true, length = 500)
    private String credentialId; // Identifiant de la clé généré par l'authentificateur (Base64URL)

    @Column(name = "public_key", nullable = false, columnDefinition = "TEXT")
    private String publicKey; // Clé publique X.509 SPKI encodée en Base64 / Base64URL

    @Builder.Default
    @Column(name = "signature_count", nullable = false)
    private Long signatureCount = 0L; // Compteur de signature pour détection de clonage (anti-replay)

    @Column(name = "device_label", length = 150)
    private String deviceLabel; // Nom convivial (ex: "iPhone 13 Pro", "Samsung Galaxy S23")

    @Column(name = "device_uuid", length = 64)
    private String deviceUuid; // UUID unique de l'appareil (Device UUID / Hardware fingerprint)

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;
}
