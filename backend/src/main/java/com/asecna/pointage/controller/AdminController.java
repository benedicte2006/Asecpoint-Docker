package com.asecna.pointage.controller;

import com.asecna.pointage.dto.ApiResponse;
import com.asecna.pointage.dto.PasswordResetRequest;
import com.asecna.pointage.dto.UserCreateRequest;
import com.asecna.pointage.dto.UserDto;
import com.asecna.pointage.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_UNIT_ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserDto>>> getAllUsers(@AuthenticationPrincipal com.asecna.pointage.entity.User currentUser) {
        return ResponseEntity.ok(ApiResponse.ok("Liste des agents et utilisateurs", adminService.getUsersVisibleTo(currentUser)));
    }

    @PostMapping("/users")
    public ResponseEntity<ApiResponse<UserDto>> createUser(
            @Valid @RequestBody UserCreateRequest request,
            @AuthenticationPrincipal com.asecna.pointage.entity.User currentUser
    ) {
        UserDto created = adminService.createUser(request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Utilisateur créé avec succès", created));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal com.asecna.pointage.entity.User currentUser
    ) {
        adminService.deleteUser(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Utilisateur supprimé", null));
    }

    @PostMapping("/users/{id}/reset-device")
    public ResponseEntity<ApiResponse<Void>> resetUserDevice(
            @PathVariable Long id,
            @AuthenticationPrincipal com.asecna.pointage.entity.User currentUser
    ) {
        adminService.resetUserDevice(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Smartphone et clé biométrique réinitialisés avec succès pour cet agent.", null));
    }

    @PutMapping("/users/{id}/password")
    public ResponseEntity<ApiResponse<Void>> resetUserPassword(
            @PathVariable Long id,
            @Valid @RequestBody PasswordResetRequest request,
            @AuthenticationPrincipal com.asecna.pointage.entity.User currentUser
    ) {
        adminService.resetUserPassword(id, request.getNewPassword(), currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Mot de passe réinitialisé. Communiquez-le directement à l'utilisateur.", null));
    }
}