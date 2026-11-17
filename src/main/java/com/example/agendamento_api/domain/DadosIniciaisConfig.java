package com.example.agendamento_api.domain;

import com.example.agendamento_api.domain.model.Servico;
import com.example.agendamento_api.domain.repository.ServicoRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.List;

@Configuration
public class DadosIniciaisConfig {

    @Bean
    CommandLineRunner carregarServicos(ServicoRepository servicoRepository) {
        return args -> {
            if (servicoRepository.count() == 0) {
                servicoRepository.saveAll(List.of(
                    new Servico("Design de Sobrancelhas", new BigDecimal("35.00")),
                    new Servico("Design com Henna", new BigDecimal("50.00")),
                    new Servico("Design com Tintura", new BigDecimal("70.00")),
                    new Servico("Epilação Buço", new BigDecimal("15.00")),
                    new Servico("Epilação Nariz", new BigDecimal("10.00")),
                    new Servico("Epilação Axila", new BigDecimal("25.00")),
                    new Servico("Epilação Perna Completa", new BigDecimal("45.00")),
                    new Servico("Epilação Meia Perna", new BigDecimal("30.00")),
                    new Servico("Epilação Virilha", new BigDecimal("40.00")),
                    new Servico("Epilação Íntima Completa", new BigDecimal("65.00")),
                    new Servico("Epilação Peito", new BigDecimal("30.00")),
                    new Servico("Epilação Barriga", new BigDecimal("30.00")),
                    new Servico("Epilação Peito/Barriga", new BigDecimal("50.00"))
                ));
                System.out.println(">>> Serviços iniciais registados com sucesso na base de dados!");
            }
        };
    }
}