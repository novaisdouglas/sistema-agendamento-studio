package com.example.agendamento_api.domain.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "disponibilidade_dia")
public class DisponibilidadeDia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private LocalDate data;

    private boolean diaFechado;

    // Guarda os horários disponíveis separados por vírgula. Ex: "14:00,15:00,17:00"
    @Column(length = 500)
    private String horariosDisponiveis;

    public DisponibilidadeDia() {
    }

    public DisponibilidadeDia(LocalDate data, boolean diaFechado, String horariosDisponiveis) {
        this.data = data;
        this.diaFechado = diaFechado;
        this.horariosDisponiveis = horariosDisponiveis;
    }

    public Long getId() {
        return id;
    }

    public LocalDate getData() {
        return data;
    }

    public void setData(LocalDate data) {
        this.data = data;
    }

    public boolean isDiaFechado() {
        return diaFechado;
    }

    public void setDiaFechado(boolean diaFechado) {
        this.diaFechado = diaFechado;
    }

    public String getHorariosDisponiveis() {
        return horariosDisponiveis;
    }

    public void setHorariosDisponiveis(String horariosDisponiveis) {
        this.horariosDisponiveis = horariosDisponiveis;
    }
}