package com.asecna.pointage.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UniteRequest {
    @NotBlank
    private String nom;

    private String description;

    @NotBlank
    private String codeUnite;
}
