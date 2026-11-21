package com.example.agendamento_api;

import com.example.agendamento_api.domain.repository.AgendamentoRepository;
import com.example.agendamento_api.domain.repository.ServicoRepository;
import com.example.agendamento_api.dto.AgendamentoRequestDTO;
import com.example.agendamento_api.service.AgendamentoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class AgendamentoApiApplicationTests {

	@Autowired
	private AgendamentoRepository agendamentoRepository;

	@Autowired
	private AgendamentoService agendamentoService;

	@Autowired
	private ServicoRepository servicoRepository;

	@BeforeEach
	void limparAgendamentos() {
		agendamentoRepository.deleteAll();
	}

	@Test
	void contextLoads() {
	}

	@Test
	void carregaServicosIniciaisEPermiteCriarAgendamento() {
		assertTrue(servicoRepository.count() > 0);

		var servico = servicoRepository.findAll().get(0);
		var pedido = novoPedido(servico.getId());
		var criado = agendamentoService.criarAgendamento(pedido);

		assertNotNull(criado.getId());
		assertEquals("Maria Silva", criado.getNomeCliente());
		assertEquals(pedido.dataHoraInicio(), criado.getDataHoraInicio());
		assertEquals(pedido.dataHoraInicio().plusMinutes(30), criado.getDataHoraFim());
		assertEquals(1, agendamentoRepository.count());
	}

	@Test
	void rejeitaAgendamentoComHorarioSobreposto() {
		var servico = servicoRepository.findAll().get(0);
		var pedido = novoPedido(servico.getId());
		agendamentoService.criarAgendamento(pedido);

		assertThrows(RuntimeException.class, () -> agendamentoService.criarAgendamento(pedido));
		assertEquals(1, agendamentoRepository.count());
	}

	private AgendamentoRequestDTO novoPedido(Long servicoId) {
		var inicio = LocalDateTime.now().plusDays(1).withHour(14).withMinute(0).withSecond(0).withNano(0);
		return new AgendamentoRequestDTO("Maria Silva", "44999998888", null, List.of(servicoId), inicio);
	}
}
