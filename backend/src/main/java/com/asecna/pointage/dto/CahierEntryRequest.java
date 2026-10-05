package com.asecna.pointage.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CahierEntryRequest {
    @NotBlank
    private String titre;

    @NotBlank
    private String contenu;

    private String categorie; // "CONSIGNE", "INCIDENT", "RELÈVE_DE_QUART", "OPÉRATION", "MAINTENANCE"

    private String degreUrgence; // "INFO", "NORMAL", "URGENT", "CRITIQUE"

    private Long uniteId; // Optionnel : si non fourni, utilise l'unité de l'agent connecté

    private String photos; // Photos jointes (JSON array Base64 ou URL)

    private LocalDateTime horodatageEvenement; // Optionnel : si null, LocalDateTime.now()
}
