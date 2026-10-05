package com.asecna.pointage.service;

import com.asecna.pointage.dto.QrSessionResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class QrSessionService {

    @Value("${app.base-url:http://localhost}")
    private String appBaseUrl;

    @Value("${app.qr-session.ttl-seconds:60}")
    private long ttlSeconds;

    private static class SessionData {
        String token;
        LocalDateTime expiresAt;
        boolean consumed;

        SessionData(String token, LocalDateTime expiresAt) {
            this.token = token;
            this.expiresAt = expiresAt;
            this.consumed = false;
        }
    }

    private final Map<String, SessionData> activeSessions = new ConcurrentHashMap<>();

    public QrSessionResponse generateQrSession() {
        String sessionId = UUID.randomUUID().toString();
        String token = UUID.randomUUID().toString().replace("-", "");
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(ttlSeconds);

        activeSessions.put(sessionId, new SessionData(token, expiresAt));

        // URL directe menant à la page Angular mobile de scan instantané
        // Si l'utilisateur passe par un reverse-proxy ou Ngrok, l'URL reflètera APP_BASE_URL
        String cleanBaseUrl = appBaseUrl.replaceAll("/+$", "");
        String qrUrl = String.format("%s/scan?session=%s&token=%s", cleanBaseUrl, sessionId, token);

        log.info("==> Nouvelle session QR générée : session={}, expire={}", sessionId, expiresAt);

        return QrSessionResponse.builder()
                .sessionId(sessionId)
                .token(token)
                .qrUrl(qrUrl)
                .expiresInSeconds(ttlSeconds)
                .expiresAt(expiresAt)
                .build();
    }

    public boolean validateAndConsumeSession(String sessionId, String token) {
        SessionData data = activeSessions.get(sessionId);
        if (data == null) {
            log.warn("Session QR inexistante : {}", sessionId);
            return false;
        }

        if (data.consumed) {
            log.warn("Session QR déjà consommée : {}", sessionId);
            return false;
        }

        if (LocalDateTime.now().isAfter(data.expiresAt)) {
            log.warn("Session QR expirée : {}", sessionId);
            activeSessions.remove(sessionId);
            return false;
        }

        if (!data.token.equals(token)) {
            log.warn("Jeton de session QR invalide pour session : {}", sessionId);
            return false;
        }

        // Marque comme consommé (utilisation unique pour éviter le rejeu)
        data.consumed = true;
        return true;
    }

    @Scheduled(fixedRate = 30000)
    public void cleanupExpiredSessions() {
        LocalDateTime now = LocalDateTime.now();
        activeSessions.entrySet().removeIf(entry -> entry.getValue().consumed || now.isAfter(entry.getValue().expiresAt));
    }
}
