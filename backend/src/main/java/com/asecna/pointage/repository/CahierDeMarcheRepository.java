package com.asecna.pointage.repository;

import com.asecna.pointage.entity.CahierDeMarche;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CahierDeMarcheRepository extends JpaRepository<CahierDeMarche, Long> {
    List<CahierDeMarche> findBySupprimeLeIsNullAndUniteIdOrderByHorodatageEvenementDesc(Long uniteId);
    List<CahierDeMarche> findBySupprimeLeIsNullOrderByHorodatageEvenementDesc();
    List<CahierDeMarche> findBySupprimeLeIsNotNullOrderBySupprimeLeDesc();
    List<CahierDeMarche> findBySupprimeLeIsNotNullAndUniteIdOrderBySupprimeLeDesc(Long uniteId);
}
