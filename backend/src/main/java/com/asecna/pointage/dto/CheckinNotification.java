package com.asecna.pointage.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckinNotification {
    private String status; // "SUCCESS", "ERROR"
    private String message;
    private Long agentId;
    private String matricule;
    private String nomComplet;
    private String fonction;
    private String uniteNom;
    private String typePointage;
    private LocalDateTime timestamp;
    private String sessionId;
}
