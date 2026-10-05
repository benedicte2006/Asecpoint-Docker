package com.asecna.pointage.repository;

import com.asecna.pointage.entity.Unite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UniteRepository extends JpaRepository<Unite, Long> {
    Optional<Unite> findByCodeUnite(String codeUnite);
    Optional<Unite> findByNom(String nom);
    boolean existsByCodeUnite(String codeUnite);
}
