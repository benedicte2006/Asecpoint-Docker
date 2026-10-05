package com.asecna.pointage.controller;

import com.asecna.pointage.dto.ApiResponse;
import com.asecna.pointage.dto.CahierEntryRequest;
import com.asecna.pointage.entity.CahierDeMarche;
import com.asecna.pointage.entity.User;
import com.asecna.pointage.service.CahierDeMarcheService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cahier-de-marche")
@RequiredArgsConstructor
public class CahierDeMarcheController {

    private final CahierDeMarcheService cahierDeMarcheService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CahierDeMarche>>> getEntries(
            @RequestParam(required = false) Long uniteId,
            @AuthenticationPrincipal User currentUser
    ) {
        List<CahierDeMarche> entries = cahierDeMarcheService.getEntries(uniteId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Entrées du cahier de marche", entries));
    }

    @GetMapping("/suppressions")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_UNIT_ADMIN')")
    public ResponseEntity<ApiResponse<List<CahierDeMarche>>> getDeletedEntries(
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Historique des suppressions", cahierDeMarcheService.getDeletedEntries(currentUser)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CahierDeMarche>> getEntryById(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        CahierDeMarche entry = cahierDeMarcheService.getEntryById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Détail de l'entrée", entry));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CahierDeMarche>> createEntry(
            @Valid @RequestBody CahierEntryRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        CahierDeMarche created = cahierDeMarcheService.createEntry(request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Entrée consignée dans le cahier de marche", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_UNIT_ADMIN')")
    public ResponseEntity<ApiResponse<CahierDeMarche>> updateEntry(
            @PathVariable Long id,
            @Valid @RequestBody CahierEntryRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        CahierDeMarche updated = cahierDeMarcheService.updateEntry(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Entrée modifiée avec succès", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_UNIT_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteEntry(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        cahierDeMarcheService.deleteEntry(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Entrée supprimée", null));
    }
}
