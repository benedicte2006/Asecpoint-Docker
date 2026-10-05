package com.asecna.pointage.entity;
import com.asecna.pointage.enums.TypePointage;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "pointages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Pointage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
    private User user;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private TypePointage type; // ARRIVEE, DEPART, etc.

    @Column(name = "device_uuid", length = 100)
    private String deviceUuid;

    @Column(name = "client_ip", length = 45)
    private String clientIp;

    @Column(name = "user_agent", length = 512)
    private String userAgent;

    @Column(name = "credential_id", length = 255)
    private String credentialId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    @com.fasterxml.jackson.annotation.JsonProperty("horodatage")
    public LocalDateTime getHorodatage() {
        return this.timestamp;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("typePointage")
    public String getTypePointage() {
        if (this.type == null) return "PRISE_DE_SERVICE";
        return this.type == TypePointage.ENTREE ? "PRISE_DE_SERVICE" : "FIN_DE_SERVICE";
    }

    @com.fasterxml.jackson.annotation.JsonProperty("ipAddress")
    public String getIpAddress() {
        return this.clientIp;
    }
}