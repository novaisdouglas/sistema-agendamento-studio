package com.example.agendamento_api.service;

import com.example.agendamento_api.domain.repository.AgendamentoRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class LimpezaMensalScheduler {

    private final AgendamentoRepository agendamentoRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public LimpezaMensalScheduler(AgendamentoRepository agendamentoRepository) {
        this.agendamentoRepository = agendamentoRepository;
    }

    // Roda todo dia 1º de cada mês às 03:00 (horário de Brasília)
    @Scheduled(cron = "0 0 3 1 * *", zone = "America/Sao_Paulo")
    @Transactional
    public void limparAgendamentosAntigos() {
        LocalDateTime inicioMesAtual = LocalDate.now().withDayOfMonth(1).atStartOfDay();

        // Remove da tabela intermediária os vínculos de agendamentos de meses anteriores
        entityManager.createNativeQuery(
            "DELETE FROM agendamento_servicos WHERE agendamento_id IN (" +
            "SELECT id FROM tb_agendamentos WHERE data_hora_inicio < :inicioMes)"
        ).setParameter("inicioMes", inicioMesAtual).executeUpdate();

        // Remove os agendamentos de meses anteriores (preservando os futuros!)
        int apagados = entityManager.createNativeQuery(
            "DELETE FROM tb_agendamentos WHERE data_hora_inicio < :inicioMes"
        ).setParameter("inicioMes", inicioMesAtual).executeUpdate();

        // Se não restou nenhum agendamento futuro na virada do mês, zera o contador de ID para voltar ao #1
        if (agendamentoRepository.count() == 0) {
            entityManager.createNativeQuery(
                "ALTER SEQUENCE tb_agendamentos_id_seq RESTART WITH 1"
            ).executeUpdate();
            System.out.println(">>> Limpeza mensal concluída: " + apagados + " registros removidos e ID reiniciado para 1.");
        } else {
            System.out.println(">>> Limpeza mensal concluída: " + apagados + " registros antigos removidos (agendamentos futuros mantidos).");
        }
    }
}