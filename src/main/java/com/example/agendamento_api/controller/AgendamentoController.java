package com.example.agendamento_api.controller;

import com.example.agendamento_api.domain.model.Agendamento;
import com.example.agendamento_api.domain.model.StatusAgendamento;
import com.example.agendamento_api.domain.repository.AgendamentoRepository;
import com.example.agendamento_api.dto.AgendamentoRequestDTO;
import com.example.agendamento_api.dto.AgendamentoResponseDTO;
import com.example.agendamento_api.service.AgendamentoService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/agendamentos")
public class AgendamentoController {

    private final AgendamentoService agendamentoService;
    private final AgendamentoRepository agendamentoRepository;

    public AgendamentoController(AgendamentoService agendamentoService, AgendamentoRepository agendamentoRepository) {
        this.agendamentoService = agendamentoService;
        this.agendamentoRepository = agendamentoRepository;
    }

    @PostMapping
    public ResponseEntity<?> criarAgendamento(@Valid @RequestBody AgendamentoRequestDTO dto) {
        try {
            Agendamento novo = agendamentoService.criarAgendamento(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(new AgendamentoResponseDTO(novo));
        } catch (RuntimeException e) {
            // Captura RuntimeException (como conflito de horário e serviço não encontrado)
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
            public ResponseEntity<?> buscarPorId(@PathVariable("id") Long id) {
            return agendamentoRepository.findById(id)
            .map(agendamento -> ResponseEntity.ok(new AgendamentoResponseDTO(agendamento)))
            .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
}

    @PatchMapping("/{id}/cancelar")
    public ResponseEntity<?> cancelarAgendamento(@PathVariable("id") Long id) {
        try {
            Agendamento cancelado = agendamentoService.cancelarAgendamento(id);
            return ResponseEntity.ok(new AgendamentoResponseDTO(cancelado));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/concluir")
    public ResponseEntity<?> concluirAgendamento(@PathVariable Long id) {
        return agendamentoRepository.findById(id)
                .map(agendamento -> {
                    if (agendamento.getStatus() == StatusAgendamento.CANCELADO) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Não é possível concluir um atendimento que está cancelado");
                    }
                    agendamento.setStatus(StatusAgendamento.CONCLUIDO); // ou "CONCLUIDO" se for String
                    agendamentoRepository.save(agendamento);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<AgendamentoResponseDTO>> listarAgendamentos(
            @RequestParam(value = "data", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        
        List<Agendamento> lista;

        if (data != null) {
            LocalDateTime inicioDia = data.atTime(0, 0, 0);
            LocalDateTime fimDia = data.atTime(23, 59, 59);
            lista = agendamentoRepository.findByDataHoraInicioBetweenAndStatusNot(inicioDia, fimDia, StatusAgendamento.CANCELADO);
        } else {
            // Busca todos os agendamentos ativos a partir de hoje
            LocalDateTime inicioHoje = LocalDate.now().atTime(0, 0, 0);
            lista = agendamentoRepository.findAll().stream().filter(a -> !a.getDataHoraInicio().isBefore(inicioHoje)).toList();
        }

        List<AgendamentoResponseDTO> agendamentos = lista.stream()
                .map(AgendamentoResponseDTO::new)
                .toList();

        return ResponseEntity.ok(agendamentos);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> tratarErrosValidacao(MethodArgumentNotValidException ex) {
        Map<String, String> erros = new HashMap<>();
        
        ex.getBindingResult().getFieldErrors().forEach(erro -> 
            erros.put(erro.getField(), erro.getDefaultMessage())
        );
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(erros);
    }
}