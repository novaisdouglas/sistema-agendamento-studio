package com.example.agendamento_api.dto;

import com.example.agendamento_api.domain.model.Agendamento;
import com.example.agendamento_api.domain.model.Servico;
import com.example.agendamento_api.domain.model.StatusAgendamento;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public record AgendamentoResponseDTO(
    Long id,
    String nomeCliente,
    String telefoneCliente,
    String nomeServico,
    BigDecimal precoServico,
    Integer duracaoTotalMinutos,
    LocalDateTime dataHoraInicio,
    LocalDateTime dataHoraFim,
    StatusAgendamento status
) {
    // Construtor utilitário que suporta tanto agendamentos antigos (1 serviço) quanto novos (múltiplos)
    public AgendamentoResponseDTO(Agendamento agendamento) {
        this(
            agendamento.getId(),
            agendamento.getNomeCliente(),
            agendamento.getTelefoneCliente(),
            montarNomesServicos(agendamento.getTodosServicos()),
            somarPrecosServicos(agendamento.getTodosServicos()),
            somarDuracaoServicos(agendamento.getTodosServicos()),
            agendamento.getDataHoraInicio(),
            agendamento.getDataHoraFim(),
            agendamento.getStatus()
        );
    }

    private static String montarNomesServicos(List<Servico> servicos) {
        if (servicos == null || servicos.isEmpty()) {
            return "Serviço não informado";
        }
        return servicos.stream()
                .map(Servico::getNome)
                .collect(Collectors.joining(" + "));
    }

    private static BigDecimal somarPrecosServicos(List<Servico> servicos) {
        if (servicos == null || servicos.isEmpty()) {
            return BigDecimal.ZERO;
        }
        return servicos.stream()
                .map(Servico::getPreco)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static Integer somarDuracaoServicos(List<Servico> servicos) {
        if (servicos == null || servicos.isEmpty()) {
            return 30;
        }
        return servicos.stream()
                .mapToInt(Servico::getDuracaoMinutos)
                .sum();
    }
}