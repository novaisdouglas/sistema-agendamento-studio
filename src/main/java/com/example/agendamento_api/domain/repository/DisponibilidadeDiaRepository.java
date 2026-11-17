package com.example.agendamento_api.domain.repository;

import com.example.agendamento_api.domain.model.DisponibilidadeDia;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.Optional;

public interface DisponibilidadeDiaRepository extends JpaRepository<DisponibilidadeDia, Long> {
    Optional<DisponibilidadeDia> findByData(LocalDate data);
}