package com.asecna.pointage.controller;

import com.asecna.pointage.dto.ApiResponse;
import com.asecna.pointage.dto.ChangePasswordRequest;
import com.asecna.pointage.dto.UpdateProfileRequest;
import com.asecna.pointage.dto.UserDto;
import com.asecna.pointage.entity.User;
import com.asecna.pointage.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getMyProfile(@AuthenticationPrincipal User currentUser) {
        UserDto profile = profileService.getCurrentUserProfile(currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Profil récupéré avec succès", profile));
    }

    @PutMapping("/update")
    public ResponseEntity<ApiResponse<UserDto>> updateProfile(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        UserDto updated = profileService.updateProfile(currentUser, request);
        return ResponseEntity.ok(ApiResponse.ok("Profil mis à jour avec succès", updated));
    }

    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        profileService.changePassword(currentUser, request);
        return ResponseEntity.ok(ApiResponse.ok("Mot de passe modifié avec succès", null));
    }
}
