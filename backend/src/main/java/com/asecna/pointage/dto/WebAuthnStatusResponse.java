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
public class WebAuthnStatusResponse {
    private boolean enrolled;
    private String agentCode;
    private String deviceLabel;
    private LocalDateTime enrolledAt;
    private LocalDateTime lastUsedAt;
    private Long signatureCount;
}
