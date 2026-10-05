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
public class QrSessionResponse {
    private String sessionId;
    private String token;
    private String qrUrl;
    private long expiresInSeconds;
    private LocalDateTime expiresAt;
}
