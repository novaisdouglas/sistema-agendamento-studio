package com.example.agendamento_api.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDateTime;

public record AgendamentoRequestDTO(
    
    @NotBlank(message = "O nome do cliente é obrigatório.")
    String nomeCliente,

    @NotBlank(message = "O telefone do cliente é obrigatório.")
    @Pattern(regexp = "^\\d{10,11}$", message = "O telefone deve conter DDD + número (10 ou 11 dígitos numéricos).")
    String telefoneCliente,

    @NotNull(message = "O ID do serviço deve ser informado.")
    Long servicoId,

    @NotNull(message = "A data e horário do agendamento são obrigatórios.")
    @Future(message = "O agendamento só pode ser realizado para datas e horários futuros.")
    LocalDateTime dataHoraInicio
) {}