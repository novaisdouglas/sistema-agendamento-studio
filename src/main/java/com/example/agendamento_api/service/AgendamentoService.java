package com.example.agendamento_api.service;

import java.time.ZoneId;
import com.example.agendamento_api.domain.model.Agendamento;
import com.example.agendamento_api.domain.model.Servico;
import com.example.agendamento_api.domain.model.StatusAgendamento;
import com.example.agendamento_api.domain.repository.AgendamentoRepository;
import com.example.agendamento_api.domain.repository.ServicoRepository;
import com.example.agendamento_api.dto.AgendamentoRequestDTO;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AgendamentoService {

    private final AgendamentoRepository agendamentoRepository;
    private final ServicoRepository servicoRepository;

    public AgendamentoService(AgendamentoRepository agendamentoRepository, ServicoRepository servicoRepository) {
        this.agendamentoRepository = agendamentoRepository;
        this.servicoRepository = servicoRepository;
    }

    public Agendamento criarAgendamento(AgendamentoRequestDTO dto) {

            String telefone = dto.telefoneCliente() != null ? dto.telefoneCliente().trim() : "";
        if (!telefone.matches("^[1-9][0-9]9\\d{8}$") || telefone.substring(3).matches("^(\\d)\\1{7}$")) {
            throw new RuntimeException("Por favor, informe um número de celular com DDD válido (11 dígitos, começando com 9).");
}
        Servico servico = servicoRepository.findById(dto.servicoId())
                .orElseThrow(() -> new RuntimeException("Serviço não encontrado"));   
                
        LocalDateTime inicio = dto.dataHoraInicio();
        LocalDateTime fim = inicio.plusMinutes(30); // Supondo que cada serviço tenha duração de 30 minutos

        if (inicio.isBefore(LocalDateTime.now(ZoneId.of("America/Sao_Paulo")))) {
            throw new RuntimeException("Não é possível agendar em uma data ou horário que já passou.");
        }        

        if (agendamentoRepository.existeConflitoDeHorario(inicio, fim, StatusAgendamento.CANCELADO)) {
            throw new RuntimeException("Horário indisponível. Já existe um agendamento nesse intervalo.");
        }

        Agendamento agendamento = new Agendamento();
        agendamento.setNomeCliente(dto.nomeCliente());
        agendamento.setTelefoneCliente(dto.telefoneCliente());
        agendamento.setServico(servico);
        agendamento.setDataHoraInicio(inicio);
        agendamento.setDataHoraFim(fim);
        agendamento.setStatus(StatusAgendamento.CONFIRMADO);

        return agendamentoRepository.save(agendamento);
    }

    public Agendamento cancelarAgendamento(Long id) {
        Agendamento agendamento = agendamentoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agendamento não encontrado"));

        if (agendamento.getStatus() == StatusAgendamento.CANCELADO) {
            throw new RuntimeException("Agendamento já está cancelado");
        }

        if (agendamento.getStatus() == StatusAgendamento.CONCLUIDO) {
            throw new RuntimeException("Não é possível cancelar um atendimento que já foi concluído");
        }

        agendamento.setStatus(StatusAgendamento.CANCELADO);
        return agendamentoRepository.save(agendamento);
    }
}