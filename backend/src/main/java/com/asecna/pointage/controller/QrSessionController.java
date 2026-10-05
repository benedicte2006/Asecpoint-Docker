package com.asecna.pointage.controller;

import com.asecna.pointage.dto.ApiResponse;
import com.asecna.pointage.dto.QrSessionResponse;
import com.asecna.pointage.service.QrSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/qr-session")
@RequiredArgsConstructor
public class QrSessionController {

    private final QrSessionService qrSessionService;

    @GetMapping("/generate")
    public ResponseEntity<ApiResponse<QrSessionResponse>> generateSession() {
        QrSessionResponse response = qrSessionService.generateQrSession();
        return ResponseEntity.ok(ApiResponse.ok("Session QR générée", response));
    }
}
