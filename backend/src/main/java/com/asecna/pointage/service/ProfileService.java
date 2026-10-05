package com.asecna.pointage.service;

import com.asecna.pointage.dto.ChangePasswordRequest;
import com.asecna.pointage.dto.UpdateProfileRequest;
import com.asecna.pointage.dto.UserDto;
import com.asecna.pointage.entity.User;
import com.asecna.pointage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminService adminService;

    public UserDto getCurrentUserProfile(User currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));
        return adminService.mapToUserDto(user);
    }

    @Transactional
    public UserDto updateProfile(User currentUser, UpdateProfileRequest request) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));

        user.setNom(request.getNom().trim().toUpperCase());
        user.setPrenom(request.getPrenom().trim());
        if (request.getFonction() != null) {
            user.setFonction(request.getFonction().trim());
        }

        User saved = userRepository.save(user);
        log.info("==> Profil mis à jour pour agent : {} (Matricule: {})", saved.getUsername(), saved.getMatricule());
        return adminService.mapToUserDto(saved);
    }

    @Transactional
    public void changePassword(User currentUser, ChangePasswordRequest request) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Le mot de passe actuel saisi est incorrect.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.saveAndFlush(user);
        log.info("==> Mot de passe modifié avec succès pour agent : {} ({})", user.getUsername(), user.getMatricule());
    }
}
