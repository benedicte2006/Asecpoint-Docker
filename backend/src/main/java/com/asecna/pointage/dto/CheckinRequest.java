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
public class CheckinRequest {
    @NotBlank
    private String sessionId;

    @NotBlank
    private String token;

    @Builder.Default
    private String typePointage = "PRISE_DE_SERVICE";

    /** Mot de passe de l'agent pour vérification anti-fraude */
    @NotBlank(message = "Le mot de passe est obligatoire pour confirmer le pointage")
    private String password;

    /** UUID optionnel du smartphone (conservé pour traçabilité dans les logs de pointage) */
    private String deviceUuid;
}
