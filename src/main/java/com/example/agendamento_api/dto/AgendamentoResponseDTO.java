package com.example.agendamento_api.dto;

import com.example.agendamento_api.domain.model.Agendamento;
import com.example.agendamento_api.domain.model.StatusAgendamento;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AgendamentoResponseDTO(
    Long id,
    String nomeCliente,
    String telefoneCliente,
    String nomeServico,
    BigDecimal precoServico,
    LocalDateTime dataHoraInicio,
    LocalDateTime dataHoraFim,
    StatusAgendamento status
) {
    // Construtor utilitário para converter direto da entidade
    public AgendamentoResponseDTO(Agendamento agendamento) {
        this(
            agendamento.getId(),
            agendamento.getNomeCliente(),
            agendamento.getTelefoneCliente(),
            agendamento.getServico().getNome(),
            agendamento.getServico().getPreco(),
            agendamento.getDataHoraInicio(),
            agendamento.getDataHoraFim(),
            agendamento.getStatus()
        );
    }
}