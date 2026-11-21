package com.example.agendamento_api.service;

import com.example.agendamento_api.domain.model.Agendamento;
import com.example.agendamento_api.domain.model.DisponibilidadeDia;
import com.example.agendamento_api.domain.model.Servico;
import com.example.agendamento_api.domain.model.StatusAgendamento;
import com.example.agendamento_api.domain.repository.AgendamentoRepository;
import com.example.agendamento_api.domain.repository.DisponibilidadeDiaRepository;
import com.example.agendamento_api.domain.repository.ServicoRepository;
import com.example.agendamento_api.dto.AgendamentoRequestDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class AgendamentoService {

    private final AgendamentoRepository agendamentoRepository;
    private final ServicoRepository servicoRepository;
    private final DisponibilidadeDiaRepository disponibilidadeDiaRepository;

    // Horário padrão quando o dia não foi personalizado no admin (14:00 às 18:00)
    private static final List<String> HORARIOS_PADRAO = List.of(
            "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"
    );

    public AgendamentoService(
            AgendamentoRepository agendamentoRepository,
            ServicoRepository servicoRepository,
            DisponibilidadeDiaRepository disponibilidadeDiaRepository
    ) {
        this.agendamentoRepository = agendamentoRepository;
        this.servicoRepository = servicoRepository;
        this.disponibilidadeDiaRepository = disponibilidadeDiaRepository;
    }

    @Transactional
    public Agendamento criarAgendamento(AgendamentoRequestDTO dto) {

        String telefone = dto.telefoneCliente() != null ? dto.telefoneCliente().trim() : "";
        if (!telefone.matches("^[1-9][0-9]9\\d{8}$") || telefone.substring(3).matches("^(\\d)\\1{7}$")) {
            throw new RuntimeException("Por favor, informe um número de celular com DDD válido (11 dígitos, começando com 9).");
        }

        List<Long> ids = dto.obterServicosIds();
        if (ids.isEmpty()) {
            throw new RuntimeException("Selecione pelo menos um serviço para agendar.");
        }
        if (ids.size() > 3) {
            throw new RuntimeException("Você pode selecionar no máximo 3 serviços por sessão.");
        }

        // Busca todos os serviços selecionados (preservando a ordem e permitindo repetição se houver)
        List<Servico> servicosSelecionados = new ArrayList<>();
        for (Long idServico : ids) {
            Servico servico = servicoRepository.findById(idServico)
                    .orElseThrow(() -> new RuntimeException("Serviço não encontrado (ID: " + idServico + ")"));
            servicosSelecionados.add(servico);
        }

        int duracaoTotalMinutos = servicosSelecionados.stream()
                .mapToInt(Servico::getDuracaoMinutos)
                .sum();

        if (duracaoTotalMinutos > 120) {
            throw new RuntimeException("A duração total dos serviços não pode ultrapassar 2 horas (120 minutos) por sessão.");
        }

        // Converte minutos reais em blocos de 30 minutos (arredondando para cima, mínimo 1 bloco)
        int blocosNecessarios = Math.max(1, (int) Math.ceil(duracaoTotalMinutos / 30.0));

        LocalDateTime inicio = dto.dataHoraInicio();
        LocalDateTime fim = inicio.plusMinutes(blocosNecessarios * 30L);

        if (inicio.isBefore(LocalDateTime.now(ZoneId.of("America/Sao_Paulo")))) {
            throw new RuntimeException("Não é possível agendar em uma data ou horário que já passou.");
        }

        // Valida se todos os blocos consecutivos estão abertos na disponibilidade daquele dia
        validarDisponibilidadeBlocos(inicio, blocosNecessarios);

        // Valida se não há conflito com nenhum agendamento já marcado no intervalo [inicio, fim)
        if (agendamentoRepository.existeConflitoDeHorario(inicio, fim, StatusAgendamento.CANCELADO)) {
            throw new RuntimeException("Horário indisponível. Não há tempo livre suficiente a partir desse horário.");
        }

        Agendamento agendamento = new Agendamento();
        agendamento.setNomeCliente(dto.nomeCliente().trim());
        agendamento.setTelefoneCliente(telefone);
        agendamento.setServicos(servicosSelecionados); // Já preenche também o campo legado 'servico'
        agendamento.setDataHoraInicio(inicio);
        agendamento.setDataHoraFim(fim);
        agendamento.setStatus(StatusAgendamento.CONFIRMADO);

        return agendamentoRepository.save(agendamento);
    }

    private void validarDisponibilidadeBlocos(LocalDateTime inicio, int blocosNecessarios) {
        Optional<DisponibilidadeDia> configOpt = disponibilidadeDiaRepository.findByData(inicio.toLocalDate());

        List<String> horariosAbertos;
        if (configOpt.isPresent()) {
            DisponibilidadeDia config = configOpt.get();
            if (config.isDiaFechado()) {
                throw new RuntimeException("O estúdio estará fechado nesta data.");
            }
            String horariosStr = config.getHorariosDisponiveis();
            if (horariosStr == null || horariosStr.isBlank()) {
                horariosAbertos = List.of();
            } else {
                horariosAbertos = java.util.Arrays.stream(horariosStr.split(","))
                        .map(String::trim)
                        .toList();
            }
        } else {
            horariosAbertos = HORARIOS_PADRAO;
        }

        DateTimeFormatter fmtHora = DateTimeFormatter.ofPattern("HH:mm");
        for (int i = 0; i < blocosNecessarios; i++) {
            String slotNecessario = inicio.plusMinutes(i * 30L).format(fmtHora);
            if (!horariosAbertos.contains(slotNecessario)) {
                throw new RuntimeException("Este horário não comporta a duração total dos serviços selecionados antes do fechamento.");
            }
        }
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