package com.example.agendamento_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDateTime;

public record AgendamentoRequestDTO(
    
    @NotBlank(message = "O nome do cliente é obrigatório.")
    String nomeCliente,

    @NotBlank(message = "O telefone do cliente é obrigatório.")
    @Pattern(regexp = "^[1-9][0-9]9\\d{8}$", message = "Por favor, informe um número de celular com DDD válido (11 dígitos, começando com 9).")
    String telefoneCliente,

    @NotNull(message = "O ID do serviço deve ser informado.")
    Long servicoId,

    @NotNull(message = "A data e horário do agendamento são obrigatórios.")
    LocalDateTime dataHoraInicio
) {}