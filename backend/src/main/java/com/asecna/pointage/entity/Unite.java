package com.asecna.pointage.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "unites")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Unite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String nom; // ex: "Tour de Contrôle", "Météorologie", "Maintenance Radio/Radionavigation", "Service Sauvetage"

    @Column(length = 255)
    private String description;

    @Column(name = "code_unite", nullable = false, unique = true, length = 50)
    private String codeUnite; // ex: "TWR", "MET", "RAD", "SLI"

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
