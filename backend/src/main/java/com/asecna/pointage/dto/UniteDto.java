package com.asecna.pointage.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UniteDto {
    private Long id;
    private String nom;
    private String description;
    private String codeUnite;
    private LocalDateTime createdAt;
}
