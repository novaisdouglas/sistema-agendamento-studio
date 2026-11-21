package com.example.agendamento_api.domain;

import com.example.agendamento_api.domain.model.Servico;
import com.example.agendamento_api.domain.repository.ServicoRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Configuration
public class DadosIniciaisConfig {

    @Bean
    CommandLineRunner carregarServicos(ServicoRepository servicoRepository) {
        return args -> {
            // Mapa com a duração real de cada serviço
            Map<String, Integer> duracoesReais = Map.ofEntries(
                Map.entry("Design de Sobrancelhas", 30),
                Map.entry("Design com Henna", 60),
                Map.entry("Design com Tintura", 60),
                Map.entry("Epilação Buço", 10),
                Map.entry("Epilação Nariz", 10),
                Map.entry("Epilação Axila", 20),
                Map.entry("Epilação Perna Completa", 30),
                Map.entry("Epilação Meia Perna", 20),
                Map.entry("Epilação Virilha", 30),
                Map.entry("Epilação Íntima Completa", 40),
                Map.entry("Epilação Peito", 20),
                Map.entry("Epilação Barriga", 20),
                Map.entry("Epilação Peito/Barriga", 30),
                Map.entry("Brow Lamination", 60)
            );

            // 1. Se o banco estiver vazio, cadastra tudo
            if (servicoRepository.count() == 0) {
                servicoRepository.saveAll(List.of(
                    new Servico("Design de Sobrancelhas", new BigDecimal("35.00"), 30),
                    new Servico("Design com Henna", new BigDecimal("50.00"), 60),
                    new Servico("Design com Tintura", new BigDecimal("70.00"), 60),
                    new Servico("Epilação Buço", new BigDecimal("15.00"), 10),
                    new Servico("Epilação Nariz", new BigDecimal("10.00"), 10),
                    new Servico("Epilação Axila", new BigDecimal("25.00"), 20),
                    new Servico("Epilação Perna Completa", new BigDecimal("45.00"), 30),
                    new Servico("Epilação Meia Perna", new BigDecimal("30.00"), 20),
                    new Servico("Epilação Virilha", new BigDecimal("40.00"), 30),
                    new Servico("Epilação Íntima Completa", new BigDecimal("65.00"), 40),
                    new Servico("Epilação Peito", new BigDecimal("30.00"), 20),
                    new Servico("Epilação Barriga", new BigDecimal("30.00"), 20),
                    new Servico("Epilação Peito/Barriga", new BigDecimal("50.00"), 30),
                    new Servico("Brow Lamination", new BigDecimal("140.00"), 60)
                ));
                System.out.println(">>> Serviços iniciais registrados com sucesso!");
                return;
            }

            // 2. Se o banco já tiver dados (ex: produção), atualiza as durações e adiciona o Brow Lamination se faltar
            List<Servico> existentes = servicoRepository.findAll();
            boolean temBrow = false;

            for (Servico s : existentes) {
                if (s.getNome().equalsIgnoreCase("Brow Lamination")) {
                    temBrow = true;
                }
                Integer duracaoCorreta = duracoesReais.get(s.getNome());
                if (duracaoCorreta != null && !duracaoCorreta.equals(s.getDuracaoMinutos())) {
                    s.setDuracaoMinutos(duracaoCorreta);
                    servicoRepository.save(s);
                }
            }

            if (!temBrow) {
                servicoRepository.save(new Servico("Brow Lamination", new BigDecimal("140.00"), 60));
                System.out.println(">>> Brow Lamination adicionado com sucesso!");
            }
        };
    }
}