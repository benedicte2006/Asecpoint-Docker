package com.asecna.pointage.repository;

import com.asecna.pointage.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByMatricule(String matricule);
    boolean existsByUsername(String username);
    boolean existsByMatricule(String matricule);
    Optional<User> findByDeviceUuid(String deviceUuid);
    boolean existsByDeviceUuid(String deviceUuid);
    List<User> findByUnite_Id(Long uniteId);
}
