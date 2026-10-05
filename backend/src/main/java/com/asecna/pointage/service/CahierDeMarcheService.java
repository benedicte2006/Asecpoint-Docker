package com.asecna.pointage.service;

import com.asecna.pointage.dto.CahierEntryRequest;
import com.asecna.pointage.entity.CahierDeMarche;
import com.asecna.pointage.entity.Role;
import com.asecna.pointage.entity.Unite;
import com.asecna.pointage.entity.User;
import com.asecna.pointage.repository.CahierDeMarcheRepository;
import com.asecna.pointage.repository.UniteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CahierDeMarcheService {

    private final CahierDeMarcheRepository cahierDeMarcheRepository;
    private final UniteRepository uniteRepository;

    public List<CahierDeMarche> getEntries(Long uniteId, User currentUser) {
        if (currentUser.getRole() != Role.ROLE_ADMIN) {
            if (currentUser.getUnite() == null) {
                return List.of();
            }
            return cahierDeMarcheRepository.findBySupprimeLeIsNullAndUniteIdOrderByHorodatageEvenementDesc(
                    currentUser.getUnite().getId());
        }

        if (uniteId != null) {
            return cahierDeMarcheRepository.findBySupprimeLeIsNullAndUniteIdOrderByHorodatageEvenementDesc(uniteId);
        }
        return cahierDeMarcheRepository.findBySupprimeLeIsNullOrderByHorodatageEvenementDesc();
    }

    public List<CahierDeMarche> getDeletedEntries(User currentUser) {
        if (currentUser.getRole() == Role.ROLE_UNIT_ADMIN && currentUser.getUnite() != null) {
            return cahierDeMarcheRepository.findBySupprimeLeIsNotNullAndUniteIdOrderBySupprimeLeDesc(
                    currentUser.getUnite().getId());
        }
        if (currentUser.getRole() != Role.ROLE_ADMIN) {
            throw new AccessDeniedException("Seul un administrateur peut consulter les suppressions du cahier.");
        }
        return cahierDeMarcheRepository.findBySupprimeLeIsNotNullOrderBySupprimeLeDesc();
    }

    public CahierDeMarche getEntryById(Long id, User currentUser) {
        return cahierDeMarcheRepository.findById(id)
                .filter(entry -> entry.getSupprimeLe() == null)
                .filter(entry -> currentUser.getRole() == Role.ROLE_ADMIN
                        || currentUser.getUnite() != null
                        && currentUser.getUnite().getId().equals(entry.getUnite().getId()))
                .orElseThrow(() -> new IllegalArgumentException("Entrée de cahier de marche non trouvée avec l'id : " + id));
    }

    @Transactional
    public CahierDeMarche createEntry(CahierEntryRequest request, User currentUser) {
        // Détermination de l'unité
        Unite targetUnite;
        if (currentUser.getRole() == Role.ROLE_ADMIN && request.getUniteId() != null) {
            targetUnite = uniteRepository.findById(request.getUniteId())
                    .orElseThrow(() -> new IllegalArgumentException("Unité spécifiée introuvable : " + request.getUniteId()));
        } else if (currentUser.getUnite() != null) {
            targetUnite = currentUser.getUnite();
        } else {
            throw new IllegalArgumentException("Veuillez spécifier une unité pour cette note de service.");
        }

        LocalDateTime eventTime = request.getHorodatageEvenement() != null
                ? request.getHorodatageEvenement()
                : LocalDateTime.now();

        CahierDeMarche entry = CahierDeMarche.builder()
                .unite(targetUnite)
                .redacteur(currentUser)
                .titre(request.getTitre())
                .contenu(request.getContenu())
                .photos(request.getPhotos())
                .categorie(request.getCategorie() != null ? request.getCategorie() : "CONSIGNE")
                .degreUrgence(request.getDegreUrgence() != null ? request.getDegreUrgence() : "NORMAL")
                .horodatageEvenement(eventTime)
                .build();

        log.info("==> Nouvelle entrée dans le Cahier de Marche créée par {} pour l'unité {}",
                currentUser.getUsername(), targetUnite.getNom());

        return cahierDeMarcheRepository.save(entry);
    }

    @Transactional
    public CahierDeMarche updateEntry(Long id, CahierEntryRequest request, User currentUser) {
        // Seul l'administrateur a le droit de modifier une entrée existante
        if (currentUser.getRole() != Role.ROLE_ADMIN && currentUser.getRole() != Role.ROLE_UNIT_ADMIN) {
            throw new AccessDeniedException("Seul un administrateur est autorisé à modifier une entrée du cahier de marche.");
        }

        CahierDeMarche entry = getEntryById(id, currentUser);
        entry.setTitre(request.getTitre());
        entry.setContenu(request.getContenu());
        if (request.getPhotos() != null) entry.setPhotos(request.getPhotos());
        if (request.getCategorie() != null) entry.setCategorie(request.getCategorie());
        if (request.getDegreUrgence() != null) entry.setDegreUrgence(request.getDegreUrgence());
        if (request.getHorodatageEvenement() != null) entry.setHorodatageEvenement(request.getHorodatageEvenement());

        return cahierDeMarcheRepository.save(entry);
    }

    @Transactional
    public void deleteEntry(Long id, User currentUser) {
        // Seul l'administrateur a le droit de supprimer
        if (currentUser.getRole() != Role.ROLE_ADMIN && currentUser.getRole() != Role.ROLE_UNIT_ADMIN) {
            throw new AccessDeniedException("Seul un administrateur est autorisé à supprimer une entrée du cahier de marche.");
        }

        CahierDeMarche entry = getEntryById(id, currentUser);
        entry.setSupprimeLe(LocalDateTime.now());
        entry.setSupprimePar(currentUser);
        cahierDeMarcheRepository.save(entry);
        log.info("Suppression du cahier: entryId={}, adminId={}, admin={}, uniteId={}, unite={}, titre={}, supprimeLe={}",
            id, currentUser.getId(), currentUser.getUsername(), entry.getUnite().getId(),
            entry.getUnite().getNom(), entry.getTitre(), entry.getSupprimeLe());
    }
}
