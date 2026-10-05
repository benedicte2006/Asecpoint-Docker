package com.asecna.pointage.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "cahier_de_marche")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CahierDeMarche {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "unite_id", nullable = false)
    private Unite unite;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "redacteur_id", nullable = false)
    private User redacteur;

    @Column(name = "horodatage_evenement", nullable = false)
    private LocalDateTime horodatageEvenement;

    @Column(name = "titre", nullable = false, length = 150)
    private String titre;

    @Column(name = "contenu", nullable = false, columnDefinition = "TEXT")
    private String contenu;

    @Column(name = "categorie", length = 50)
    private String categorie; // ex: "CONSIGNE", "INCIDENT", "RELÈVE_DE_QUART", "OPÉRATION", "MAINTENANCE"

    @Column(name = "degre_urgence", length = 20)
    @Builder.Default
    private String degreUrgence = "NORMAL"; // "INFO", "NORMAL", "URGENT", "CRITIQUE"

    @Column(name = "photos", columnDefinition = "LONGTEXT")
    private String photos; // Photos jointes (tableau JSON de Base64 Data URLs ou URLs d'images)

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "supprime_le")
    private LocalDateTime supprimeLe;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "supprime_par_id")
    private User supprimePar;
}
