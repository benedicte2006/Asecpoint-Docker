package com.asecna.pointage.service;

import com.asecna.pointage.dto.*;
import com.asecna.pointage.entity.AgentCredential;
import com.asecna.pointage.entity.User;
import com.asecna.pointage.repository.AgentCredentialRepository;
import com.asecna.pointage.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.X509EncodedKeySpec;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebAuthnService {

    private final AgentCredentialRepository agentCredentialRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.base-url:http://localhost}")
    private String appBaseUrl;

    private static class ChallengeData {
        final String challenge;
        final LocalDateTime expiresAt;
        final String type; // "ASSERTION" ou "REGISTRATION"

        ChallengeData(String challenge, LocalDateTime expiresAt, String type) {
            this.challenge = challenge;
            this.expiresAt = expiresAt;
            this.type = type;
        }
    }

    // Cache mémoire pour les challenges éphémères (validité 60s)
    private final Map<String, ChallengeData> activeChallenges = new ConcurrentHashMap<>();

    /**
     * Génère un challenge cryptographique et renvoie le credentialId associé à l'agent
     */
    public WebAuthnChallengeResponse generateAssertionChallenge(String codeAgent, HttpServletRequest request) {
        log.info("==> Génération de challenge WebAuthn pour l'agent : {}", codeAgent);

        // 1. Vérification de l'existence de l'agent
        User agent = findAgentByCode(codeAgent)
                .orElseThrow(() -> new IllegalArgumentException("Agent introuvable avec le code ou matricule : " + codeAgent));

        // 2. Recherche du credential enregistré pour cet agent
        AgentCredential credential = agentCredentialRepository.findByAgentCode(agent.getMatricule())
                .or(() -> agentCredentialRepository.findByAgentCode(agent.getUsername()))
                .orElseThrow(() -> new IllegalStateException(
                        "Aucune clé biométrique / Passkey enregistrée pour l'agent " + agent.getPrenom() + " " + agent.getNom() + 
                        ". Veuillez procéder à l'enrôlement initial de l'appareil."
                ));

        // 3. Génération d'un challenge de 32 octets aléatoires
        byte[] challengeBytes = new byte[32];
        secureRandom.nextBytes(challengeBytes);
        String challengeBase64Url = Base64.getUrlEncoder().withoutPadding().encodeToString(challengeBytes);

        // 4. Stockage du challenge avec la clé basée STRICTEMENT sur le matricule résolu
        String cacheKey = "ASSERTION:" + normalizeCode(agent.getMatricule());
        activeChallenges.put(cacheKey, new ChallengeData(challengeBase64Url, LocalDateTime.now().plusSeconds(60), "ASSERTION"));

        String rpId = resolveRpId(request);

        return WebAuthnChallengeResponse.builder()
                .challenge(challengeBase64Url)
                .credentialId(credential.getCredentialId())
                .rpId(rpId)
                .timeout(60000)
                .userVerification("required")
                .build();
    }

    /**
     * Vérifie la signature cryptographique et l'attestation de présence biométrique
     */
    @Transactional
    public boolean verifyAssertion(WebAuthnValidationRequest request, HttpServletRequest httpRequest) {
        String agentCode = request.getAgentCode();
        log.info("==> Validation de signature WebAuthn pour agent : {}", agentCode);

        // 1. Résolution de l'agent
        User agent = findAgentByCode(agentCode)
                .orElseThrow(() -> new IllegalArgumentException("Agent introuvable : " + agentCode));

        // Vérification et consommation du challenge via le matricule unique
        String cacheKey = "ASSERTION:" + normalizeCode(agent.getMatricule());
        ChallengeData challengeData = activeChallenges.remove(cacheKey);

        if (challengeData == null || LocalDateTime.now().isAfter(challengeData.expiresAt)) {
            log.warn("Échec WebAuthn : challenge inexistant ou expiré pour l'agent [{}]", agentCode);
            throw new IllegalArgumentException("Le challenge de pointage a expiré ou est invalide. Veuillez rescanner le QR code.");
        }

        // 2. Récupération du credential enregistré
        AgentCredential credential = agentCredentialRepository.findByCredentialId(request.getCredentialId())
                .orElseThrow(() -> {
                    log.warn("Alerte Sécurité WebAuthn : Identifiant de clé biométrique [{}] non reconnu dans le système ASECPoint", request.getCredentialId());
                    return new SecurityException("Appareil non autorisé : La clé biométrique de cet appareil n'est pas reconnue.");
                });

        if (!normalizeCode(credential.getAgentCode()).equals(normalizeCode(agent.getMatricule())) &&
            !normalizeCode(credential.getAgentCode()).equals(normalizeCode(agent.getUsername()))) {
            log.warn("Alerte Sécurité WebAuthn : La clé utilisée [{}] n'appartient pas à l'agent [{}]", request.getCredentialId(), agentCode);
            throw new SecurityException("Cette clé biométrique n'est pas assignée à ce compte agent. Pointage frauduleux rejeté.");
        }

        // 3. Validation de clientDataJSON
        byte[] clientDataBytes = decodeBase64Flexible(request.getClientDataJSON());
        try {
            JsonNode clientData = objectMapper.readTree(clientDataBytes);
            String type = clientData.path("type").asText();
            if (!"webauthn.get".equals(type)) {
                throw new SecurityException("Type de cérémonie WebAuthn incorrect : " + type);
            }

            String clientChallenge = clientData.path("challenge").asText();
            if (!challengeData.challenge.equals(clientChallenge)) {
                log.warn("Challenge mismatch : reçu=[{}], attendu=[{}]", clientChallenge, challengeData.challenge);
                throw new SecurityException("Incoherence de challenge cryptographique (possible tentative de rejeu).");
            }
        } catch (Exception e) {
            log.error("Erreur de décodage clientDataJSON : {}", e.getMessage());
            throw new IllegalArgumentException("clientDataJSON invalide : " + e.getMessage(), e);
        }

        // 4. Validation d'authenticatorData (UP, UV, signCount)
        byte[] authData = decodeBase64Flexible(request.getAuthenticatorData());
        if (authData.length < 37) {
            throw new IllegalArgumentException("authenticatorData tronqué (longueur < 37 octets).");
        }

        byte flags = authData[32];
        boolean userPresent = (flags & 0x01) != 0;       // Bit 0: UP
        boolean userVerified = (flags & 0x04) != 0;      // Bit 2: UV (Biométrie: Empreinte / Face ID)

        if (!userPresent) {
            log.warn("Échec pointage WebAuthn : Présence utilisateur non constatée");
            throw new SecurityException("Présence utilisateur non constatée par l'authentificateur.");
        }

        if (!userVerified) {
            log.warn("Échec pointage WebAuthn : Vérification biométrique UV manquante pour [{}]", agentCode);
            throw new SecurityException("L'accord biométrique strict (Empreinte digitale / Face ID) est obligatoire pour ce pointage.");
        }

        // Lecture du compteur de signature (octets 33 à 36, big-endian)
        long signCount = ((authData[33] & 0xFFL) << 24) |
                         ((authData[34] & 0xFFL) << 16) |
                         ((authData[35] & 0xFFL) << 8) |
                         (authData[36] & 0xFFL);

        log.info("==> WebAuthn Compteur de signatures : reçu={}, stocké={}", signCount, credential.getSignatureCount());

        // Contrôle anti-clonage adapté aux Passkeys : appliqué uniquement si le téléphone envoie un signCount strictement positif.
        if (signCount > 0 && credential.getSignatureCount() > 0 && signCount <= credential.getSignatureCount()) {
            log.error("ALERTE CRITIQUE : Détection de clonage d'authentificateur pour [{}] (reçu: {}, stocké: {})", 
                    agentCode, signCount, credential.getSignatureCount());
            throw new SecurityException("Alerte de sécurité anti-clonage FIDO2 : Compteur de signatures suspect. Pointage refusé.");
        }

        // 5. Vérification cryptographique de la signature ECDSA
        try {
            // Hash SHA-256 de clientDataJSON
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] clientDataHash = digest.digest(clientDataBytes);

            // Données signées = authenticatorData + SHA-256(clientDataJSON)
            byte[] signedData = new byte[authData.length + clientDataHash.length];
            System.arraycopy(authData, 0, signedData, 0, authData.length);
            System.arraycopy(clientDataHash, 0, signedData, authData.length, clientDataHash.length);

            // Reconstitution de la clé publique de l'agent (X.509 SPKI)
            byte[] publicKeyBytes = decodeBase64Flexible(credential.getPublicKey());
            KeyFactory keyFactory = KeyFactory.getInstance("EC");
            PublicKey publicKey = keyFactory.generatePublic(new X509EncodedKeySpec(publicKeyBytes));

            // Vérification de la signature ECDSA (SHA256withECDSA)
            byte[] signatureBytes = decodeBase64Flexible(request.getSignature());
            Signature verifier = Signature.getInstance("SHA256withECDSA");
            verifier.initVerify(publicKey);
            verifier.update(signedData);

            boolean isValid = verifier.verify(signatureBytes);
            if (!isValid) {
                log.warn("Échec WebAuthn : Signature cryptographique ECDSA invalide pour l'agent [{}]", agentCode);
                throw new SecurityException("Signature cryptographique WebAuthn invalide.");
            }

            log.info("==> Signature biométrique WebAuthn CERTIFIÉE avec succès pour [{}] !", agentCode);

        } catch (SecurityException se) {
            throw se;
        } catch (Exception ex) {
            log.error("Erreur technique lors de la vérification cryptographique WebAuthn : {}", ex.getMessage(), ex);
            throw new SecurityException("Erreur de vérification de signature : " + ex.getMessage(), ex);
        }

        // 6. Mise à jour de l'état du credential
        if (signCount > 0) {
            credential.setSignatureCount(signCount);
        } else {
            credential.setSignatureCount(credential.getSignatureCount() + 1);
        }

        credential.setLastUsedAt(LocalDateTime.now());
        agentCredentialRepository.save(credential);

        return true;
    }

    /**
     * Génère les options d'enrôlement pour enregistrer un nouveau smartphone/passkey
     */
    public WebAuthnRegisterOptionsResponse generateRegistrationOptions(String codeAgent, HttpServletRequest request) {
        log.info("==> Demande d'options d'enrôlement WebAuthn pour : {}", codeAgent);

        User agent = findAgentByCode(codeAgent)
                .orElseThrow(() -> new IllegalArgumentException("Agent introuvable avec le code : " + codeAgent));

        Optional<AgentCredential> existingCred = agentCredentialRepository.findByAgentCode(agent.getMatricule())
                .or(() -> agentCredentialRepository.findByAgentCode(agent.getUsername()));

        if (existingCred.isPresent()) {
            throw new SecurityException("Ce compte agent possède déjà un smartphone enrôlé. " +
                    "La réinitialisation en cas de changement de téléphone se fait exclusivement par l'administrateur.");
        }

        byte[] challengeBytes = new byte[32];
        secureRandom.nextBytes(challengeBytes);
        String challengeBase64Url = Base64.getUrlEncoder().withoutPadding().encodeToString(challengeBytes);

        String cacheKey = "REGISTRATION:" + normalizeCode(agent.getMatricule());
        activeChallenges.put(cacheKey, new ChallengeData(challengeBase64Url, LocalDateTime.now().plusSeconds(120), "REGISTRATION"));

        String rpId = resolveRpId(request);

        return WebAuthnRegisterOptionsResponse.builder()
                .challenge(challengeBase64Url)
                .rpId(rpId)
                .rpName("ASECNA Pointage Sécurisé")
                .userId(Base64.getUrlEncoder().withoutPadding().encodeToString(agent.getMatricule().getBytes(StandardCharsets.UTF_8)))
                .userName(agent.getUsername())
                .userDisplayName(agent.getPrenom() + " " + agent.getNom())
                .timeout(60000)
                .attestation("none")
                .build();
    }

    /**
     * Enregistre la clé publique WebAuthn de l'agent après accord biométrique d'enrôlement
     */
    @Transactional
    public AgentCredential registerCredential(WebAuthnRegisterRequest request) {
        String agentCode = request.getAgentCode();
        log.info("==> Finalisation de l'enrôlement de la clé WebAuthn pour : {}", agentCode);

        User agent = findAgentByCode(agentCode)
                .orElseThrow(() -> new IllegalArgumentException("Agent introuvable : " + agentCode));

        // Validation du challenge d'enrôlement via le matricule
        String cacheKey = "REGISTRATION:" + normalizeCode(agent.getMatricule());
        ChallengeData challengeData = activeChallenges.remove(cacheKey);

        if (challengeData == null || LocalDateTime.now().isAfter(challengeData.expiresAt)) {
            throw new IllegalArgumentException("Le challenge d'enrôlement a expiré. Veuillez relancer la procédure.");
        }

        // RÈGLE DE SÉCURITÉ STRICTE : Un seul appareil/credential actif par agent
        Optional<AgentCredential> existingCred = agentCredentialRepository.findByAgentCode(agent.getMatricule())
                .or(() -> agentCredentialRepository.findByAgentCode(agent.getUsername()));

        if (existingCred.isPresent()) {
            log.warn("Tentative d'enrôlement rejetée : l'agent [{}] a déjà un appareil enrôlé (credentialId: {})",
                    agent.getMatricule(), existingCred.get().getCredentialId());
            throw new SecurityException("Ce compte agent possède déjà un smartphone enrôlé. " +
                    "La réinitialisation en cas de changement de téléphone se fait exclusivement par l'administrateur.");
        }

        // Vérification qu'aucun autre compte n'utilise ce credentialId
        if (agentCredentialRepository.findByCredentialId(request.getCredentialId()).isPresent()) {
            throw new SecurityException("Cette clé biométrique est déjà enregistrée dans le système.");
        }

        AgentCredential credential = AgentCredential.builder()
                .agentCode(agent.getMatricule())
                .credentialId(request.getCredentialId())
                .publicKey(request.getPublicKey())
                .signatureCount(0L)
                .deviceLabel(request.getDeviceLabel() != null && !request.getDeviceLabel().isBlank() 
                        ? request.getDeviceLabel() 
                        : "Smartphone Personnel Agent")
                .createdAt(LocalDateTime.now())
                .lastUsedAt(null)
                .build();

        AgentCredential saved = agentCredentialRepository.save(credential);
        log.info("==> Enrôlement WebAuthn réussi pour agent {} (Matricule: {}) avec credentialId [{}]", 
                agent.getUsername(), agent.getMatricule(), saved.getCredentialId());

        return saved;
    }

    /**
     * Réinitialise la clé WebAuthn de l'agent (ex: en cas de perte, casse ou changement de smartphone)
     */
    @Transactional
    public void resetCredentialForAgent(String codeAgent) {
        log.info("==> Réinitialisation administrative du credential WebAuthn et du smartphone pour : {}", codeAgent);
        User agent = findAgentByCode(codeAgent)
                .orElseThrow(() -> new IllegalArgumentException("Agent introuvable : " + codeAgent));

        agentCredentialRepository.deleteByAgentCode(agent.getMatricule());
        agentCredentialRepository.deleteByAgentCode(agent.getUsername());

        log.info("==> Credential WebAuthn / Passkey FIDO2 révoqué pour l'agent {}. L'agent peut désormais enrôler un nouvel appareil.", agent.getMatricule());
    }

    /**
     * Retourne l'état d'enrôlement d'un agent
     */
    public WebAuthnStatusResponse getEnrollmentStatus(String codeAgent) {
        User agent = findAgentByCode(codeAgent)
                .orElseThrow(() -> new IllegalArgumentException("Agent introuvable : " + codeAgent));

        Optional<AgentCredential> optCred = agentCredentialRepository.findByAgentCode(agent.getMatricule())
                .or(() -> agentCredentialRepository.findByAgentCode(agent.getUsername()));

        if (optCred.isEmpty()) {
            return WebAuthnStatusResponse.builder()
                    .enrolled(false)
                    .agentCode(agent.getMatricule())
                    .build();
        }

        AgentCredential cred = optCred.get();
        return WebAuthnStatusResponse.builder()
                .enrolled(true)
                .agentCode(agent.getMatricule())
                .deviceLabel(cred.getDeviceLabel())
                .enrolledAt(cred.getCreatedAt())
                .lastUsedAt(cred.getLastUsedAt())
                .signatureCount(cred.getSignatureCount())
                .build();
    }

    // --- Utilitaires internes ---

    public Optional<User> findAgentByCode(String code) {
        if (code == null || code.isBlank()) return Optional.empty();
        return userRepository.findByMatricule(code.trim().toUpperCase())
                .or(() -> userRepository.findByUsername(code.trim().toLowerCase()));
    }

    private String normalizeCode(String code) {
        return code != null ? code.trim().toUpperCase() : "";
    }

    private String resolveRpId(HttpServletRequest request) {
        try {
            if (appBaseUrl != null && !appBaseUrl.isBlank()) {
                URI uri = URI.create(appBaseUrl);
                String host = uri.getHost();
                if (host != null && !host.isBlank()) {
                    return host;
                }
            }
        } catch (Exception ignored) {}

        if (request != null) {
            String serverName = request.getServerName();
            if (serverName != null && !serverName.isBlank()) {
                return serverName;
            }
        }

        return "localhost";
    }

    private byte[] decodeBase64Flexible(String input) {
        if (input == null) return new byte[0];
        String clean = input.trim();
        try {
            return Base64.getUrlDecoder().decode(clean);
        } catch (IllegalArgumentException e) {
            return Base64.getDecoder().decode(clean);
        }
    }

    @Scheduled(fixedRate = 30000)
    public void cleanupExpiredChallenges() {
        LocalDateTime now = LocalDateTime.now();
        activeChallenges.entrySet().removeIf(entry -> now.isAfter(entry.getValue().expiresAt));
    }
}