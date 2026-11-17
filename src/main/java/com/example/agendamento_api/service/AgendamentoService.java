package com.example.agendamento_api.service;

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
        Servico servico = servicoRepository.findById(dto.servicoId())
                .orElseThrow(() -> new RuntimeException("Serviço não encontrado"));

        LocalDateTime inicio = dto.dataHoraInicio();
        LocalDateTime fim = inicio.plusMinutes(30); // Supondo que cada serviço tenha duração de 30 minutos

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