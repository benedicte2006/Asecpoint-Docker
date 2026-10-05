package com.asecna.pointage.repository;

import com.asecna.pointage.entity.AgentCredential;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AgentCredentialRepository extends JpaRepository<AgentCredential, Long> {
    Optional<AgentCredential> findByAgentCode(String agentCode);
    Optional<AgentCredential> findByCredentialId(String credentialId);
    boolean existsByAgentCode(String agentCode);
    void deleteByAgentCode(String agentCode);
}
