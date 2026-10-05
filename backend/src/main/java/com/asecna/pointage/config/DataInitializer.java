package com.asecna.pointage.config;

import com.asecna.pointage.entity.CahierDeMarche;
import com.asecna.pointage.entity.Role;
import com.asecna.pointage.entity.Unite;
import com.asecna.pointage.entity.User;
import com.asecna.pointage.repository.CahierDeMarcheRepository;
import com.asecna.pointage.repository.UniteRepository;
import com.asecna.pointage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UniteRepository uniteRepository;
    private final UserRepository userRepository;
    private final CahierDeMarcheRepository cahierDeMarcheRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (uniteRepository.count() == 0) {
            log.info("==> Initialisation des unités ASECNA...");
            Unite twr = uniteRepository.save(Unite.builder()
                    .codeUnite("TWR")
                    .nom("Tour de Contrôle & Approche")
                    .description("Gestion de la circulation aérienne d'aérodrome et d'approche")
                    .build());

            Unite cns = uniteRepository.save(Unite.builder()
                    .codeUnite("CNS")
                    .nom("Maintenance CNS & Radionavigation")
                    .description("Communication, Navigation, Surveillance et infrastructures télécoms")
                    .build());

            Unite met = uniteRepository.save(Unite.builder()
                    .codeUnite("MET")
                    .nom("Centre Météorologique d'Aérodrome")
                    .description("Observations et prévisions aéronautiques TAF/METAR")
                    .build());

            Unite sli = uniteRepository.save(Unite.builder()
                    .codeUnite("SLI")
                    .nom("Service Sauvetage & Sécurité Incendie (SSIS)")
                    .description("Sécurité des pistes et intervention d'urgence")
                    .build());

            log.info("==> Initialisation des utilisateurs de test ASECNA...");
            User admin = userRepository.save(User.builder()
                    .matricule("ASEC-ADM-001")
                    .username("admin")
                    .password(passwordEncoder.encode("adminpassword123"))
                    .nom("DIALLO")
                    .prenom("Mamadou")
                    .fonction("Chef de Centre / Administrateur")
                    .role(Role.ROLE_ADMIN)
                    .unite(twr)
                    .active(true)
                    .build());

            User agentTwr = userRepository.save(User.builder()
                    .matricule("ASEC-AGT-101")
                    .username("agent.twr")
                    .password(passwordEncoder.encode("agent123"))
                    .nom("KOUASSI")
                    .prenom("Jean-Luc")
                    .fonction("Contrôleur de la Circulation Aérienne")
                    .role(Role.ROLE_AGENT)
                    .unite(twr)
                    .active(true)
                    .build());

            User agentCns = userRepository.save(User.builder()
                    .matricule("ASEC-AGT-102")
                    .username("agent.cns")
                    .password(passwordEncoder.encode("agent123"))
                    .nom("TRAORÉ")
                    .prenom("Aminata")
                    .fonction("Ingénieure Télécoms / Radionavigation")
                    .role(Role.ROLE_AGENT)
                    .unite(cns)
                    .active(true)
                    .build());

            User agentMet = userRepository.save(User.builder()
                    .matricule("ASEC-AGT-103")
                    .username("agent.met")
                    .password(passwordEncoder.encode("agent123"))
                    .nom("OUEDRAOGO")
                    .prenom("Paul")
                    .fonction("Météorologiste Prévisionniste")
                    .role(Role.ROLE_AGENT)
                    .unite(met)
                    .active(true)
                    .build());

            // Exemple initial dans le cahier de marche
            cahierDeMarcheRepository.save(CahierDeMarche.builder()
                    .unite(twr)
                    .redacteur(agentTwr)
                    .titre("Prise de quart Tour - Visibilité optimale")
                    .contenu("Prise de quart assurée. QNH 1013 hPa, vent 060° 08kt, piste 21 en service. Aucun incident radio.")
                    .categorie("RELÈVE_DE_QUART")
                    .degreUrgence("NORMAL")
                    .horodatageEvenement(LocalDateTime.now().minusHours(2))
                    .build());

            log.info("==> Initialisation terminée avec succès !");
            log.info("    Comptes prêts :");
            log.info("    - Admin : admin / adminpassword123");
            log.info("    - Agents : agent.twr / agent123 | agent.cns / agent123 | agent.met / agent123");
        }
    }
}
