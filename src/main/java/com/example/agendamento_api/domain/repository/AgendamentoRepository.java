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

    @Query("""
        SELECT DISTINCT a FROM Agendamento a
        LEFT JOIN FETCH a.servicos
        WHERE a.dataHoraInicio BETWEEN :inicioDia AND :fimDia
          AND a.status <> :statusCancelado
        ORDER BY a.dataHoraInicio ASC
    """)
    List<Agendamento> findByDataHoraInicioBetweenAndStatusNot(
        @Param("inicioDia") LocalDateTime inicioDia,
        @Param("fimDia") LocalDateTime fimDia,
        @Param("statusCancelado") StatusAgendamento statusCancelado
    );

    @Query("""
        SELECT DISTINCT a FROM Agendamento a
        LEFT JOIN FETCH a.servicos
        WHERE a.dataHoraInicio >= :inicioHoje
        ORDER BY a.dataHoraInicio ASC
    """)
    List<Agendamento> findAllAPartirDeHojeComServicos(@Param("inicioHoje") LocalDateTime inicioHoje);
}