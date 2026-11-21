package com.example.agendamento_api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AgendamentoApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(AgendamentoApiApplication.class, args);
    }
}