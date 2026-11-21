package com.example.agendamento_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public record AgendamentoRequestDTO(
    
    @NotBlank(message = "O nome do cliente é obrigatório.")
    String nomeCliente,

    @NotBlank(message = "O telefone do cliente é obrigatório.")
    @Pattern(regexp = "^[1-9][0-9]9\\d{8}$", message = "Por favor, informe um número de celular com DDD válido (11 dígitos, começando com 9).")
    String telefoneCliente,

    Long servicoId,

    @Size(max = 3, message = "Você pode selecionar no máximo 3 serviços por agendamento.")
    List<Long> servicosIds,

    @NotNull(message = "A data e horário do agendamento são obrigatórios.")
    LocalDateTime dataHoraInicio
) {
    // Retorna sempre a lista normalizada de IDs selecionados
    public List<Long> obterServicosIds() {
        if (servicosIds != null && !servicosIds.isEmpty()) {
            return servicosIds;
        }
        if (servicoId != null) {
            return List.of(servicoId);
        }
        return List.of();
    }
    public AgendamentoRequestDTO(String nomeCliente, String telefoneCliente, Long servicoId, LocalDateTime dataHoraInicio) {
        this(nomeCliente, telefoneCliente, servicoId, null, dataHoraInicio);
    }
}