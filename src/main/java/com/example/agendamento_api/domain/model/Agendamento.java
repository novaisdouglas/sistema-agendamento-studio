package com.example.agendamento_api.domain.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tb_agendamentos")
public class Agendamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nomeCliente;

    @Column(nullable = false)
    private String telefoneCliente;

    // Mantido para retrocompatibilidade com os agendamentos já cadastrados no banco
    @ManyToOne(optional = true)
    @JoinColumn(name = "servico_id", nullable = true)
    private Servico servico;

    // Nova relação para suportar múltiplos serviços por agendamento
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "tb_agendamento_servicos",
        joinColumns = @JoinColumn(name = "agendamento_id"),
        inverseJoinColumns = @JoinColumn(name = "servico_id")
    )
    private List<Servico> servicos = new ArrayList<>();

    @Column(nullable = false)
    private LocalDateTime dataHoraInicio;

    @Column(nullable = false)
    private LocalDateTime dataHoraFim;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusAgendamento status;

    public Agendamento() {
    }

    public Agendamento(String nomeCliente, String telefoneCliente, List<Servico> servicos, LocalDateTime dataHoraInicio, LocalDateTime dataHoraFim) {
        this.nomeCliente = nomeCliente;
        this.telefoneCliente = telefoneCliente;
        this.servicos = (servicos != null) ? servicos : new ArrayList<>();
        if (!this.servicos.isEmpty()) {
            this.servico = this.servicos.get(0); // Preenche o campo legado com o 1º serviço por segurança
        }
        this.dataHoraInicio = dataHoraInicio;
        this.dataHoraFim = dataHoraFim;
        this.status = StatusAgendamento.CONFIRMADO;
    }

    // Método auxiliar que devolve sempre a lista correta (seja registro antigo ou novo)
    public List<Servico> getTodosServicos() {
        if (this.servicos != null && !this.servicos.isEmpty()) {
            return this.servicos;
        }
        if (this.servico != null) {
            return List.of(this.servico);
        }
        return new ArrayList<>();
    }

    public Long getId() {
        return id;
    }

    public String getNomeCliente() {
        return nomeCliente;
    }

    public void setNomeCliente(String nomeCliente) {
        this.nomeCliente = nomeCliente;
    }

    public String getTelefoneCliente() {
        return telefoneCliente;
    }

    public void setTelefoneCliente(String telefoneCliente) {
        this.telefoneCliente = telefoneCliente;
    }

    public Servico getServico() {
        return servico;
    }

    public void setServico(Servico servico) {
        this.servico = servico;
    }

    public List<Servico> getServicos() {
        return servicos;
    }

    public void setServicos(List<Servico> servicos) {
        this.servicos = servicos;
        if (servicos != null && !servicos.isEmpty()) {
            this.servico = servicos.get(0);
        }
    }

    public LocalDateTime getDataHoraInicio() {
        return dataHoraInicio;
    }

    public void setDataHoraInicio(LocalDateTime dataHoraInicio) {
        this.dataHoraInicio = dataHoraInicio;
    }

    public LocalDateTime getDataHoraFim() {
        return dataHoraFim;
    }

    public void setDataHoraFim(LocalDateTime dataHoraFim) {
        this.dataHoraFim = dataHoraFim;
    }

    public StatusAgendamento getStatus() {
        return status;
    }

    public void setStatus(StatusAgendamento status) {
        this.status = status;
    }
}