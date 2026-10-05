package com.asecna.pointage.controller;

import com.asecna.pointage.dto.ApiResponse;
import com.asecna.pointage.dto.UniteDto;
import com.asecna.pointage.dto.UniteRequest;
import com.asecna.pointage.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.asecna.pointage.entity.User;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/unites")
@RequiredArgsConstructor
public class UniteController {

    private final AdminService adminService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UniteDto>>> getAllUnites(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.ok("Liste des unités", adminService.getUnitesForUser(currentUser)));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<UniteDto>> createUnite(@Valid @RequestBody UniteRequest request) {
        UniteDto created = adminService.createUnite(request);
        return ResponseEntity.ok(ApiResponse.ok("Unité créée avec succès", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<UniteDto>> updateUnite(@PathVariable Long id, @Valid @RequestBody UniteRequest request) {
        UniteDto updated = adminService.updateUnite(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Unité mise à jour", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteUnite(@PathVariable Long id) {
        adminService.deleteUnite(id);
        return ResponseEntity.ok(ApiResponse.ok("Unité supprimée", null));
    }
}
