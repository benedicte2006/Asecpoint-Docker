package com.asecna.pointage.service;

import com.asecna.pointage.dto.ApiResponse;
import com.asecna.pointage.dto.CheckinNotification;
import com.asecna.pointage.dto.CheckinRequest;
import com.asecna.pointage.dto.WebAuthnValidationRequest;
import com.asecna.pointage.entity.CahierDeMarche;
import com.asecna.pointage.entity.Pointage;
import com.asecna.pointage.entity.User;
import com.asecna.pointage.enums.TypePointage;
import com.asecna.pointage.repository.CahierDeMarcheRepository;
import com.asecna.pointage.repository.PointageRepository;
import com.asecna.pointage.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PointageService {

    private final PointageRepository pointageRepository;
    private final QrSessionService qrSessionService;
    private final SimpMessagingTemplate messagingTemplate;
    private final PasswordEncoder passwordEncoder;
    private final WebAuthnService webAuthnService;
    private final CahierDeMarcheRepository cahierDeMarcheRepository;
    private final UserRepository userRepository;

    @Transactional
    public void validateOrBindUserDevice(User user, String incomingDeviceUuid) {
        if (incomingDeviceUuid == null || incomingDeviceUuid.isBlank()) {
            log.warn(
                    "Pointage autorisé sans UUID d'appareil pour l'agent [{}] (UUID non fourni par le client)",
                    user.getMatricule()
            );
            return;
        }

        String cleanUuid = incomingDeviceUuid.trim();

        if (user.getDeviceUuid() != null && !user.getDeviceUuid().isBlank()) {
            if (!user.getDeviceUuid().equalsIgnoreCase(cleanUuid)) {
                log.warn(
                        "ALERTE Sécurité : Tentative de pointage avec un téléphone non autorisé pour [{}] (reçu: '{}', autorisé: '{}')",
                        user.getMatricule(),
                        cleanUuid,
                        user.getDeviceUuid()
                );

                throw new SecurityException(
                        "Appareil non autorisé : ce compte agent est associé à un autre téléphone. " +
                        "Le pointage doit impérativement être effectué depuis le smartphone enregistré pour ce compte."
                );
            }
        } else {
            Optional<User> existingUser = userRepository.findByDeviceUuid(cleanUuid);

            if (existingUser.isPresent() && !existingUser.get().getId().equals(user.getId())) {
                log.warn(
                        "ALERTE Sécurité : Ce téléphone (UUID: {}) est déjà associé au compte de l'agent [{}]",
                        cleanUuid,
                        existingUser.get().getMatricule()
                );

                throw new SecurityException(
                        "Ce téléphone est déjà associé au compte de l'agent " +
                        existingUser.get().getPrenom() + " " +
                        existingUser.get().getNom() +
                        " (" + existingUser.get().getMatricule() + "). " +
                        "Chaque agent doit obligatoirement utiliser son propre smartphone personnel."
                );
            }

            user.setDeviceUuid(cleanUuid);
            userRepository.save(user);

            log.info(
                    "==> Smartphone lié avec succès au compte de l'agent {} (UUID: {})",
                    user.getMatricule(),
                    cleanUuid
            );
        }
    }

    /**
     * Convertit les valeurs historiques utilisées par le frontend
     * vers l'enum TypePointage utilisé par l'entité Pointage.
     */
    private TypePointage convertTypePointage(String typePointage) {
        if ("FIN_DE_SERVICE".equalsIgnoreCase(typePointage)
                || "SORTIE".equalsIgnoreCase(typePointage)) {
            return TypePointage.SORTIE;
        }

        return TypePointage.ENTREE;
    }

    /**
     * Convertit l'enum interne vers le format attendu par le frontend.
     */
    private String typePointageToString(TypePointage typePointage) {
        if (typePointage == TypePointage.SORTIE) {
            return "FIN_DE_SERVICE";
        }

        return "PRISE_DE_SERVICE";
    }

    @Transactional
    public ApiResponse<CheckinNotification> processAutoCheckin(
            CheckinRequest request,
            User currentUser,
            HttpServletRequest httpRequest
    ) {
        log.info(
                "==> Traitement du pointage automatique pour agent : {} (Matricule: {})",
                currentUser.getUsername(),
                currentUser.getMatricule()
        );

        validateOrBindUserDevice(currentUser, request.getDeviceUuid());

        if (request.getPassword() == null || request.getPassword().isBlank()) {
            log.warn(
                    "Tentative de pointage refusée : mot de passe absent pour l'agent [{}]",
                    currentUser.getUsername()
            );

            return ApiResponse.error(
                    "Le mot de passe est requis pour confirmer votre identité."
            );
        }

        boolean passwordOk = passwordEncoder.matches(
                request.getPassword(),
                currentUser.getPassword()
        );

        if (!passwordOk) {
            log.warn(
                    "Tentative de pointage refusée : mot de passe incorrect pour l'agent [{}]",
                    currentUser.getUsername()
            );

            return ApiResponse.error("Mot de passe incorrect. Pointage refusé.");
        }

        boolean isValid = qrSessionService.validateAndConsumeSession(
                request.getSessionId(),
                request.getToken()
        );

        if (!isValid) {
            log.warn(
                    "Tentative de pointage refusée : session QR invalide ou expirée [{}]",
                    request.getSessionId()
            );

            CheckinNotification errorNotif = CheckinNotification.builder()
                    .status("ERROR")
                    .message("Session QR expirée ou invalide. Veuillez rescanner.")
                    .sessionId(request.getSessionId())
                    .timestamp(LocalDateTime.now())
                    .build();

            messagingTemplate.convertAndSend(
                    "/topic/borne-session/" + request.getSessionId(),
                    errorNotif
            );

            return ApiResponse.error(
                    "Session QR expirée ou invalide. Veuillez rescanner le QR code à jour."
            );
        }

        LocalDateTime now = LocalDateTime.now();

        String clientIp = httpRequest != null
                ? extractClientIp(httpRequest)
                : "N/A";

        String rawUserAgent = httpRequest != null
                ? httpRequest.getHeader("User-Agent")
                : "N/A";

        String userAgent = rawUserAgent != null && rawUserAgent.length() > 250
                ? rawUserAgent.substring(0, 250)
                : rawUserAgent;

        TypePointage type = convertTypePointage(
                request.getTypePointage() != null
                        ? request.getTypePointage()
                        : "PRISE_DE_SERVICE"
        );

        Pointage pointage = Pointage.builder()
                .user(currentUser)
                .timestamp(now)
                .type(type)
                .clientIp(clientIp)
                .userAgent(userAgent)
                .deviceUuid(
                        request.getDeviceUuid() != null
                                ? request.getDeviceUuid().trim()
                                : null
                )
                .build();

        pointageRepository.save(pointage);
        saveJournalMiroir(currentUser, pointage.getType(), now);

        String typePointage = typePointageToString(pointage.getType());

        String nomComplet = (
                currentUser.getPrenom() + " " + currentUser.getNom()
        ).toUpperCase();

        String uniteNom = currentUser.getUnite() != null
                ? currentUser.getUnite().getNom()
                : "Non assignée";

        boolean isPrise = pointage.getType() == TypePointage.ENTREE;

        String actionLabel = isPrise
                ? "Prise de service validée !"
                : "Fin de service validée !";

        CheckinNotification notification = CheckinNotification.builder()
                .status("SUCCESS")
                .message(actionLabel)
                .agentId(currentUser.getId())
                .matricule(currentUser.getMatricule())
                .nomComplet(nomComplet)
                .fonction(currentUser.getFonction())
                .uniteNom(uniteNom)
                .typePointage(typePointage)
                .timestamp(now)
                .sessionId(request.getSessionId())
                .build();

        String destination =
                "/topic/borne-session/" + request.getSessionId();

        log.info(
                "==> Publication WebSocket sur {} : Agent {} ({})",
                destination,
                nomComplet,
                typePointage
        );

        messagingTemplate.convertAndSend(destination, notification);
        messagingTemplate.convertAndSend("/topic/pointages", notification);

        return ApiResponse.ok(actionLabel, notification);
    }

    @Transactional
    public ApiResponse<CheckinNotification> processWebAuthnCheckin(
            WebAuthnValidationRequest request,
            User authenticatedUser,
            HttpServletRequest httpRequest
    ) {
        String agentCode = request.getAgentCode();

        log.info(
                "==> Traitement du pointage biométrique WebAuthn pour l'agent : {}",
                agentCode
        );

        User targetAgent = authenticatedUser;

        if (targetAgent == null) {
            targetAgent = webAuthnService
                    .findAgentByCode(agentCode)
                    .orElse(null);
        }

        if (targetAgent == null) {
            return ApiResponse.error(
                    "Agent introuvable pour le code : " + agentCode
            );
        }

        // Validation cryptographique stricte FIDO2 — la clé privée ne quitte jamais le smartphone
        webAuthnService.verifyAssertion(request, httpRequest);

        boolean isSessionValid =
                qrSessionService.validateAndConsumeSession(
                        request.getSessionId(),
                        request.getToken()
                );

        if (!isSessionValid) {
            log.warn(
                    "Tentative de pointage WebAuthn refusée : session QR invalide ou expirée [{}]",
                    request.getSessionId()
            );

            CheckinNotification errorNotif = CheckinNotification.builder()
                    .status("ERROR")
                    .message("Session QR expirée ou invalide. Veuillez rescanner.")
                    .sessionId(request.getSessionId())
                    .timestamp(LocalDateTime.now())
                    .build();

            messagingTemplate.convertAndSend(
                    "/topic/borne-session/" + request.getSessionId(),
                    errorNotif
            );

            return ApiResponse.error(
                    "Session QR expirée ou invalide. Veuillez rescanner le QR code à jour."
            );
        }

        LocalDateTime now = LocalDateTime.now();

        String clientIp = httpRequest != null
                ? extractClientIp(httpRequest)
                : "N/A";

        String rawUserAgent = httpRequest != null
                ? httpRequest.getHeader("User-Agent")
                : "N/A";

        String userAgent = rawUserAgent != null && rawUserAgent.length() > 250
                ? rawUserAgent.substring(0, 250)
                : rawUserAgent;

        TypePointage type = convertTypePointage(
                request.getTypePointage() != null
                        ? request.getTypePointage()
                        : "PRISE_DE_SERVICE"
        );

        // Préfixe [WebAuthn-FIDO2] pour identifier la méthode d'authentification dans les logs admin
        String userAgentFido2 = "[WebAuthn-FIDO2] " + (userAgent != null ? userAgent : "");
        String userAgentStored = userAgentFido2.length() > 512 ? userAgentFido2.substring(0, 512) : userAgentFido2;

        Pointage pointage = Pointage.builder()
                .user(targetAgent)
                .timestamp(now)
                .type(type)
                .clientIp(clientIp)
                .userAgent(userAgentStored)
                .credentialId(request.getCredentialId())
                .build();

        pointageRepository.save(pointage);
        saveJournalMiroir(targetAgent, pointage.getType(), now);

        String typePointage =
                typePointageToString(pointage.getType());

        String nomComplet = (
                targetAgent.getPrenom() + " " + targetAgent.getNom()
        ).toUpperCase();

        String uniteNom = targetAgent.getUnite() != null
                ? targetAgent.getUnite().getNom()
                : "Non assignée";

        boolean isPrise = pointage.getType() == TypePointage.ENTREE;

        String actionLabel = isPrise
                ? "Prise de service biométrique validée !"
                : "Fin de service biométrique validée !";

        CheckinNotification notification = CheckinNotification.builder()
                .status("SUCCESS")
                .message(actionLabel)
                .agentId(targetAgent.getId())
                .matricule(targetAgent.getMatricule())
                .nomComplet(nomComplet)
                .fonction(targetAgent.getFonction())
                .uniteNom(uniteNom)
                .typePointage(typePointage)
                .timestamp(now)
                .sessionId(request.getSessionId())
                .build();

        messagingTemplate.convertAndSend(
                "/topic/borne-session/" + request.getSessionId(),
                notification
        );

        messagingTemplate.convertAndSend(
                "/topic/pointages",
                notification
        );

        log.info(
                "==> Pointage WebAuthn validé avec succès : Agent {} - Session {}",
                nomComplet,
                request.getSessionId()
        );

        return ApiResponse.ok(actionLabel, notification);
    }

    private void saveJournalMiroir(
            User targetAgent,
            TypePointage typePointage,
            LocalDateTime now
    ) {
        if (targetAgent.getUnite() == null) {
            log.warn("Pointage de {} non copié au cahier: aucune unité n'est affectée", targetAgent.getUsername());
            return;
        }

        String typeLabel = typePointage == TypePointage.ENTREE
                ? "PRISE DE SERVICE"
                : "FIN DE SERVICE";
        String contenu = String.format(
                "Émargement enregistré automatiquement.\nAgent : %s %s (Matricule : %s)\nUnité : %s\nAction : %s\nHorodatage : %s",
                targetAgent.getPrenom(), targetAgent.getNom(), targetAgent.getMatricule(),
                targetAgent.getUnite().getNom(), typeLabel, now);

        CahierDeMarche journalMiroirEntry = CahierDeMarche.builder()
                .unite(targetAgent.getUnite())
                .redacteur(targetAgent)
                .horodatageEvenement(now)
                .titre("ÉMARGEMENT - " + targetAgent.getPrenom() + " " + targetAgent.getNom() + " (" + typeLabel + ")")
                .contenu(contenu)
                .categorie("RELÈVE_DE_QUART")
                .degreUrgence("NORMAL")
                .createdAt(now)
                .build();

        cahierDeMarcheRepository.save(journalMiroirEntry);
        log.info("Émargement ajouté au cahier: agent={}, unité={}, action={}",
                targetAgent.getMatricule(), targetAgent.getUnite().getNom(), typeLabel);
    }

    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor =
                request.getHeader("X-Forwarded-For");

        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }

        return request.getRemoteAddr();
    }

    public List<Pointage> getHistoryForUser(User user) {
        return pointageRepository
                .findByUserIdOrderByTimestampDesc(user.getId());
    }

    public List<Pointage> getAllPointages() {
        return pointageRepository
                .findAllByOrderByTimestampDesc();
    }
}
