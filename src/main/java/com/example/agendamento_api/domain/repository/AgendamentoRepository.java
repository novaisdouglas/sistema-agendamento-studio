package com.example.agendamento_api.domain.repository;

import com.example.agendamento_api.domain.model.Agendamento;
import com.example.agendamento_api.domain.model.StatusAgendamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {

    @Query("""
        SELECT COUNT(a) > 0 FROM Agendamento a
        WHERE a.status <> :statusCancelado
          AND a.dataHoraInicio < :fim
          AND a.dataHoraFim > :inicio
    """)
    boolean existeConflitoDeHorario(
        @Param("inicio") LocalDateTime inicio,
        @Param("fim") LocalDateTime fim,
        @Param("statusCancelado") StatusAgendamento statusCancelado
    );

    // Novo método: busca agendamentos ativos de um determinado dia
    List<Agendamento> findByDataHoraInicioBetweenAndStatusNot(
        LocalDateTime inicioDia, 
        LocalDateTime fimDia, 
        StatusAgendamento statusCancelado
    );
}