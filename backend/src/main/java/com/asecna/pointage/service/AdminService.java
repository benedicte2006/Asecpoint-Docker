package com.asecna.pointage.service;

import com.asecna.pointage.dto.UniteDto;
import com.asecna.pointage.dto.UniteRequest;
import com.asecna.pointage.dto.UserCreateRequest;
import com.asecna.pointage.dto.UserDto;
import com.asecna.pointage.entity.Unite;
import com.asecna.pointage.entity.User;
import com.asecna.pointage.repository.AgentCredentialRepository;
import com.asecna.pointage.repository.UniteRepository;
import com.asecna.pointage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UniteRepository uniteRepository;
    private final UserRepository userRepository;
    private final AgentCredentialRepository agentCredentialRepository;
    private final PasswordEncoder passwordEncoder;

    // --- Gestion des Unités ---

    public List<UniteDto> getAllUnites() {
        return uniteRepository.findAll().stream()
                .map(this::mapToUniteDto)
                .collect(Collectors.toList());
    }

    public List<UniteDto> getUnitesForUser(User currentUser) {
        if (currentUser.getRole() == com.asecna.pointage.entity.Role.ROLE_UNIT_ADMIN) {
            return currentUser.getUnite() == null ? List.of() : List.of(mapToUniteDto(currentUser.getUnite()));
        }
        return getAllUnites();
    }

    @Transactional
    public UniteDto createUnite(UniteRequest request) {
        if (uniteRepository.existsByCodeUnite(request.getCodeUnite())) {
            throw new IllegalArgumentException("Le code unité '" + request.getCodeUnite() + "' existe déjà.");
        }

        Unite unite = Unite.builder()
                .nom(request.getNom())
                .description(request.getDescription())
                .codeUnite(request.getCodeUnite().toUpperCase())
                .build();

        Unite saved = uniteRepository.save(unite);
        log.info("==> Unité créée : {} ({})", saved.getNom(), saved.getCodeUnite());
        return mapToUniteDto(saved);
    }

    @Transactional
    public UniteDto updateUnite(Long id, UniteRequest request) {
        Unite unite = uniteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Unité non trouvée id=" + id));

        unite.setNom(request.getNom());
        unite.setDescription(request.getDescription());
        unite.setCodeUnite(request.getCodeUnite().toUpperCase());

        return mapToUniteDto(uniteRepository.save(unite));
    }

    @Transactional
    public void deleteUnite(Long id) {
        Unite unite = uniteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Unité non trouvée id=" + id));

        List<User> usersInUnit = userRepository.findByUnite_Id(id);
        if (!usersInUnit.isEmpty()) {
            throw new IllegalStateException("Impossible de supprimer une unité contenant encore des agents assignés.");
        }

        uniteRepository.delete(unite);
        log.info("==> Unité supprimée : id={}", id);
    }

    // --- Gestion des Utilisateurs / Agents ---

    public List<UserDto> getUsersVisibleTo(User currentUser) {
        List<User> visibleUsers;
        if (currentUser.getRole() == com.asecna.pointage.entity.Role.ROLE_ADMIN) {
            visibleUsers = userRepository.findAll();
        } else if (currentUser.getRole() == com.asecna.pointage.entity.Role.ROLE_UNIT_ADMIN
                && currentUser.getUnite() != null) {
            visibleUsers = userRepository.findByUnite_Id(currentUser.getUnite().getId());
        } else {
            throw new AccessDeniedException("Accès réservé aux administrateurs.");
        }
        return visibleUsers.stream()
                .map(this::mapToUserDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserDto createUser(UserCreateRequest request) {
        return createUser(request, null);
    }

    @Transactional
    public UserDto createUser(UserCreateRequest request, User currentUser) {
        boolean unitAdmin = currentUser != null
                && currentUser.getRole() == com.asecna.pointage.entity.Role.ROLE_UNIT_ADMIN;
        if (unitAdmin && (request.getRole() != com.asecna.pointage.entity.Role.ROLE_AGENT
                || currentUser.getUnite() == null)) {
            throw new AccessDeniedException("Un administrateur d'unité peut uniquement créer des agents dans son unité.");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Le nom d'utilisateur '" + request.getUsername() + "' est déjà utilisé.");
        }
        if (userRepository.existsByMatricule(request.getMatricule())) {
            throw new IllegalArgumentException("Le matricule '" + request.getMatricule() + "' est déjà utilisé.");
        }

        Unite unite = null;
        if (unitAdmin) {
            unite = currentUser.getUnite();
        } else if (request.getUniteId() != null) {
            unite = uniteRepository.findById(request.getUniteId())
                    .orElseThrow(() -> new IllegalArgumentException("Unité spécifiée introuvable : " + request.getUniteId()));
        }
        if (request.getRole() == com.asecna.pointage.entity.Role.ROLE_UNIT_ADMIN && unite == null) {
            throw new IllegalArgumentException("Un sous-administrateur doit être affecté à une unité.");
        }
        if (request.getRole() == com.asecna.pointage.entity.Role.ROLE_AGENT && unite == null) {
            throw new IllegalArgumentException("Un agent doit obligatoirement être affecté à une unité.");
        }

        String requestedDeviceUuid = null;
        if (request.getDeviceUuid() != null && !request.getDeviceUuid().isBlank()) {
            requestedDeviceUuid = request.getDeviceUuid().trim();
            if (userRepository.existsByDeviceUuid(requestedDeviceUuid)) {
                throw new IllegalArgumentException("Cet UUID de smartphone est déjà associé à un autre compte.");
            }
        }

        User user = User.builder()
                .matricule(request.getMatricule().toUpperCase())
                .username(request.getUsername().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .nom(request.getNom().toUpperCase())
                .prenom(request.getPrenom())
                .fonction(request.getFonction())
                .role(request.getRole())
                .unite(unite)
                .active(true)
                .deviceUuid(requestedDeviceUuid)
                .build();

        User saved = userRepository.save(user);
        log.info("==> Utilisateur/Agent créé : {} {} (Matricule: {})", saved.getPrenom(), saved.getNom(), saved.getMatricule());
        return mapToUserDto(saved);
    }

    @Transactional
    public void deleteUser(Long id, User currentUser) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé id=" + id));
        ensureCanManageUser(currentUser, user);

        agentCredentialRepository.deleteByAgentCode(user.getMatricule());
        agentCredentialRepository.deleteByAgentCode(user.getUsername());
        userRepository.delete(user);
        log.info("==> Utilisateur supprimé : id={}", id);
    }

    @Transactional
    public void resetUserDevice(Long userId, User currentUser) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé id=" + userId));
        ensureCanManageUser(currentUser, user);

        log.info("==> Réinitialisation du smartphone pour l'agent {} {} ({}) - Ancien UUID: [{}]",
                user.getPrenom(), user.getNom(), user.getMatricule(), user.getDeviceUuid());

        user.setDeviceUuid(null);
        userRepository.save(user);

        // Révoquer également la clé biométrique WebAuthn associée à cet agent
        agentCredentialRepository.deleteByAgentCode(user.getMatricule());
        agentCredentialRepository.deleteByAgentCode(user.getUsername());
        log.info("==> Appareil délié et credentials biométriques révoqués pour l'agent {}", user.getMatricule());
    }

    @Transactional
    public void resetUserPassword(Long userId, String newPassword, User currentUser) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé id=" + userId));
        ensureCanManageUser(currentUser, user);
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.saveAndFlush(user);
        log.info("Mot de passe réinitialisé par {} pour le compte {} ({})",
                currentUser.getUsername(), user.getUsername(), user.getMatricule());
    }

    private void ensureCanManageUser(User currentUser, User target) {
        if (currentUser.getRole() == com.asecna.pointage.entity.Role.ROLE_ADMIN) {
            return;
        }
        if (currentUser.getRole() == com.asecna.pointage.entity.Role.ROLE_UNIT_ADMIN
                && currentUser.getUnite() != null
                && target.getRole() == com.asecna.pointage.entity.Role.ROLE_AGENT
                && currentUser.getUnite().getId().equals(target.getUnite() != null ? target.getUnite().getId() : null)) {
            return;
        }
        throw new AccessDeniedException("Vous ne pouvez gérer que les agents de votre unité.");
    }

    // --- Mappers ---

    public UniteDto mapToUniteDto(Unite unite) {
        return UniteDto.builder()
                .id(unite.getId())
                .nom(unite.getNom())
                .description(unite.getDescription())
                .codeUnite(unite.getCodeUnite())
                .createdAt(unite.getCreatedAt())
                .build();
    }

    public UserDto mapToUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .matricule(user.getMatricule())
                .username(user.getUsername())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .fonction(user.getFonction())
                .role(user.getRole())
                .uniteId(user.getUnite() != null ? user.getUnite().getId() : null)
                .uniteNom(user.getUnite() != null ? user.getUnite().getNom() : null)
                .active(user.isActive())
                .deviceUuid(user.getDeviceUuid())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
