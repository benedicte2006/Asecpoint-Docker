package com.asecna.pointage.repository;

import com.asecna.pointage.entity.Pointage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PointageRepository extends JpaRepository<Pointage, Long> {

    @Query("SELECT p FROM Pointage p JOIN FETCH p.user u LEFT JOIN FETCH u.unite WHERE u.id = :userId ORDER BY p.timestamp DESC")
    List<Pointage> findByUserIdOrderByTimestampDesc(@Param("userId") Long userId);

    @Query("SELECT p FROM Pointage p JOIN FETCH p.user u LEFT JOIN FETCH u.unite ORDER BY p.timestamp DESC")
    List<Pointage> findAllByOrderByTimestampDesc();

    List<Pointage> findByTimestampBetweenOrderByTimestampDesc(
            LocalDateTime start,
            LocalDateTime end
    );
}
