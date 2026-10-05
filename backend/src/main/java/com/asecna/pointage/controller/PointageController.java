package com.asecna.pointage.controller;

import com.asecna.pointage.dto.*;
import com.asecna.pointage.entity.AgentCredential;
import com.asecna.pointage.entity.Pointage;
import com.asecna.pointage.entity.User;
import com.asecna.pointage.service.PointageService;
import com.asecna.pointage.service.WebAuthnService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/pointage")
@RequiredArgsConstructor
@Slf4j
public class PointageController {

    private final PointageService pointageService;
    private final WebAuthnService webAuthnService;

    // ==========================================
    // ENDPOINTS WEBAUTHN / PASSKEYS BIOMÉTRIE
    // ==========================================

    /**
     * 1. Génère et renvoie le challenge cryptographique et le credentialId de l'agent
     */
    @GetMapping("/webauthn/challenge/{codeAgent}")
    public ResponseEntity<ApiResponse<WebAuthnChallengeResponse>> getChallenge(
            @PathVariable String codeAgent,
            HttpServletRequest request
    ) {
        try {
            WebAuthnChallengeResponse challengeResponse = webAuthnService.generateAssertionChallenge(codeAgent, request);
            return ResponseEntity.ok(ApiResponse.ok("Challenge WebAuthn généré avec succès", challengeResponse));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * 2. Reçoit et vérifie la signature WebAuthn, puis valide le pointage en BD et dans le journal miroir
     * Rejette avec HTTP 401 Unauthorized si la signature ou l'appareil n'est pas autorisé
     */
    @PostMapping("/webauthn/valider")
    public ResponseEntity<ApiResponse<CheckinNotification>> validerWebAuthn(
            @Valid @RequestBody WebAuthnValidationRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest
    ) {
        try {
            ApiResponse<CheckinNotification> response = pointageService.processWebAuthnCheckin(request, currentUser, httpRequest);
            if (!response.isSuccess()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            return ResponseEntity.ok(response);
        } catch (SecurityException se) {
            log.warn("Rejet sécuritaire WebAuthn (401) pour [{}] : {}", request.getAgentCode(), se.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error(se.getMessage()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Options pour l'enrôlement initial d'un nouveau smartphone/passkey
     */
    @GetMapping("/webauthn/register/options/{codeAgent}")
    public ResponseEntity<ApiResponse<WebAuthnRegisterOptionsResponse>> getRegisterOptions(
            @PathVariable String codeAgent,
            HttpServletRequest request
    ) {
        try {
            WebAuthnRegisterOptionsResponse options = webAuthnService.generateRegistrationOptions(codeAgent, request);
            return ResponseEntity.ok(ApiResponse.ok("Options d'enrôlement WebAuthn", options));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Finalise l'enrôlement et enregistre la clé publique de l'agent
     */
    @PostMapping("/webauthn/register/complete")
    public ResponseEntity<ApiResponse<AgentCredential>> completeRegistration(
            @Valid @RequestBody WebAuthnRegisterRequest request
    ) {
        try {
            AgentCredential cred = webAuthnService.registerCredential(request);
            return ResponseEntity.ok(ApiResponse.ok("Appareil biométrique enrôlé avec succès", cred));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Échec de l'enrôlement : " + e.getMessage()));
        }
    }

    /**
     * Réinitialise la clé d'un agent (ex: perte, vol, remplacement de téléphone) - Réservé aux Administrateurs
     */
    @DeleteMapping("/webauthn/reset/{codeAgent}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> resetCredential(@PathVariable String codeAgent) {
        try {
            webAuthnService.resetCredentialForAgent(codeAgent);
            return ResponseEntity.ok(ApiResponse.ok("Clé WebAuthn réinitialisée avec succès pour l'agent " + codeAgent, null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Retourne l'état d'enrôlement WebAuthn de l'agent
     */
    @GetMapping("/webauthn/status/{codeAgent}")
    public ResponseEntity<ApiResponse<WebAuthnStatusResponse>> getStatus(@PathVariable String codeAgent) {
        try {
            WebAuthnStatusResponse status = webAuthnService.getEnrollmentStatus(codeAgent);
            return ResponseEntity.ok(ApiResponse.ok("Statut WebAuthn", status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/auto-checkin")
    public ResponseEntity<ApiResponse<CheckinNotification>> autoCheckin(
            @Valid @RequestBody CheckinRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest
    ) {
        ApiResponse<CheckinNotification> response = pointageService.processAutoCheckin(request, currentUser, httpRequest);
        if (!response.isSuccess()) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<Pointage>>> getMyHistory(@AuthenticationPrincipal User currentUser) {
        List<Pointage> list = pointageService.getHistoryForUser(currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Historique de pointage", list));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<List<Pointage>>> getAllPointages() {
        List<Pointage> list = pointageService.getAllPointages();
        return ResponseEntity.ok(ApiResponse.ok("Tous les pointages", list));
    }
}
