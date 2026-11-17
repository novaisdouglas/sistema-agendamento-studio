package com.example.agendamento_api.controller;

import com.example.agendamento_api.domain.model.DisponibilidadeDia;
import com.example.agendamento_api.domain.repository.DisponibilidadeDiaRepository;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/disponibilidade")
@CrossOrigin(origins = "*")
public class DisponibilidadeController {

    private final DisponibilidadeDiaRepository repository;

    public DisponibilidadeController(DisponibilidadeDiaRepository repository) {
        this.repository = repository;
    }

    // Retorna a regra do dia (personalizada ou padrão)
    @GetMapping
    public ResponseEntity<?> consultarDia(
            @RequestParam("data") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {

        var configOpt = repository.findByData(data);

        if (configOpt.isPresent()) {
            DisponibilidadeDia config = configOpt.get();
            List<String> lista = (config.isDiaFechado() || config.getHorariosDisponiveis() == null || config.getHorariosDisponiveis().isBlank())
                    ? Collections.emptyList()
                    : Arrays.asList(config.getHorariosDisponiveis().split(","));

            return ResponseEntity.ok(Map.of(
                    "data", data.toString(),
                    "diaFechado", config.isDiaFechado(),
                    "horarios", lista
            ));
        }

        // Regra padrão caso ela não tenha alterado o dia:
        // Domingo e Segunda fechados; Terça a Sábado das 14:00 às 18:00
        DayOfWeek diaSemana = data.getDayOfWeek();
        boolean fechadoPadrao = (diaSemana == DayOfWeek.SUNDAY || diaSemana == DayOfWeek.MONDAY);
        List<String> horariosPadrao = fechadoPadrao
                ? Collections.emptyList()
                : List.of("14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00");

        return ResponseEntity.ok(Map.of(
                "data", data.toString(),
                "diaFechado", fechadoPadrao,
                "horarios", horariosPadrao
        ));
    }

    // Salva a configuração personalizada da profissional
    @PostMapping
    public ResponseEntity<?> salvarConfiguracao(@RequestBody Map<String, Object> payload) {
        LocalDate data = LocalDate.parse(payload.get("data").toString());
        boolean diaFechado = Boolean.parseBoolean(payload.get("diaFechado").toString());

        @SuppressWarnings("unchecked")
        List<String> horarios = (List<String>) payload.get("horarios");
        String horariosString = (diaFechado || horarios == null) ? "" : String.join(",", horarios);

        DisponibilidadeDia config = repository.findByData(data)
                .orElse(new DisponibilidadeDia());

        config.setData(data);
        config.setDiaFechado(diaFechado);
        config.setHorariosDisponiveis(horariosString);

        repository.save(config);
        return ResponseEntity.ok(Map.of("mensagem", "Disponibilidade atualizada com sucesso!"));
    }
}