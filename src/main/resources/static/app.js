const API_URL = "https://sistema-agendamento-studio.onrender.com/";
const WHATSAPP_PROFISSIONAL = "5544998375875";

const GRADE_EXPEDIENTE = ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"];

const listaServicosContainer = document.getElementById("listaServicosContainer");
const resumoServicosBox = document.getElementById("resumoServicosBox");
const resumoQtdTempo = document.getElementById("resumoQtdTempo");
const resumoValorTotal = document.getElementById("resumoValorTotal");

const form = document.getElementById("formAgendamento");
const mensagemBox = document.getElementById("mensagemBox");
const dataAgendamento = document.getElementById("dataAgendamento");
const gradeHorarios = document.getElementById("gradeHorarios");
const horarioSelecionado = document.getElementById("horarioSelecionado");
const btnConfirmar = document.getElementById("btnConfirmar");

let catalogoServicos = [];
let servicosSelecionadosIds = [];

const hoje = new Date();
const ano = hoje.getFullYear();
const mes = String(hoje.getMonth() + 1).padStart(2, "0");
const dia = String(hoje.getDate()).padStart(2, "0");
const hojeISO = `${ano}-${mes}-${dia}`;
dataAgendamento.min = hojeISO;

function extrairHorario(dataIso) {
  if (!dataIso) return "";
  const dataObj = new Date(dataIso);
  return dataObj.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function somarMinutosHorario(horaStr, minutosParaSomar) {
  const [h, m] = horaStr.split(":").map(Number);
  const totalMin = h * 60 + m + minutosParaSomar;
  const novaHora = String(Math.floor(totalMin / 60)).padStart(2, "0");
  const novoMin = String(totalMin % 60).padStart(2, "0");
  return `${novaHora}:${novoMin}`;
}

function exibirMensagem(texto, tipo) {
  mensagemBox.innerHTML = texto;
  mensagemBox.className = `mensagem ${tipo}`;
  mensagemBox.style.display = "block";
}

function esconderMensagem() {
  mensagemBox.style.display = "none";
}

async function obterMensagemErro(response) {
  const corpo = await response.text();
  if (!corpo) return "";
  try {
    const erro = JSON.parse(corpo);
    if (typeof erro === "string") return erro;
    if (erro && typeof erro === "object") {
      return Object.values(erro).filter(Boolean).join("<br>");
    }
  } catch {
    return corpo;
  }
  return corpo;
}

function obterServicosSelecionados() {
  return servicosSelecionadosIds
    .map((id) => catalogoServicos.find((s) => s.id === id))
    .filter(Boolean);
}

function calcularBlocosNecessarios() {
  const selecionados = obterServicosSelecionados();
  if (selecionados.length === 0) return 1;
  const duracaoTotal = selecionados.reduce((acc, s) => acc + (s.duracaoMinutos || 30), 0);
  return Math.max(1, Math.ceil(duracaoTotal / 30));
}

function atualizarResumoServicos() {
  const selecionados = obterServicosSelecionados();

  if (selecionados.length === 0) {
    resumoServicosBox.style.display = "none";
    return;
  }

  const duracaoTotal = selecionados.reduce((acc, s) => acc + (s.duracaoMinutos || 30), 0);
  const valorTotal = selecionados.reduce((acc, s) => acc + Number(s.preco || 0), 0);
  const textoQtd = selecionados.length === 1 ? "1 serviço" : `${selecionados.length} serviços`;

  resumoQtdTempo.textContent = `${textoQtd} • ${duracaoTotal} min`;
  resumoValorTotal.textContent = `R$ ${valorTotal.toFixed(2).replace(".", ",")}`;
  resumoServicosBox.style.display = "flex";
}

function renderizarListaServicos() {
  listaServicosContainer.innerHTML = "";

  catalogoServicos.forEach((s) => {
    const selecionado = servicosSelecionadosIds.includes(s.id);
    const duracao = s.duracaoMinutos || 30;

    const item = document.createElement("label");
    item.className = `servico-item-card ${selecionado ? "selecionado" : ""}`;

    item.innerHTML = `
      <div class="servico-item-info">
        <input type="checkbox" value="${s.id}" ${selecionado ? "checked" : ""}>
        <div>
          <span class="servico-item-nome">${s.nome}</span>
          <small class="servico-item-duracao">${duracao} min</small>
        </div>
      </div>
      <span class="servico-item-preco">R$ ${Number(s.preco).toFixed(2).replace(".", ",")}</span>
    `;

    const checkbox = item.querySelector("input");
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        if (servicosSelecionadosIds.length >= 3) {
          checkbox.checked = false;
          exibirMensagem("Você pode selecionar no máximo 3 serviços por sessão.", "erro");
          return;
        }

        const duracaoAtual = obterServicosSelecionados().reduce((acc, item) => acc + (item.duracaoMinutos || 30), 0);
        if (duracaoAtual + duracao > 120) {
          checkbox.checked = false;
          exibirMensagem("A soma dos serviços não pode ultrapassar 2 horas (120 min) por sessão.", "erro");
          return;
        }

        esconderMensagem();
        servicosSelecionadosIds.push(s.id);
      } else {
        esconderMensagem();
        servicosSelecionadosIds = servicosSelecionadosIds.filter((id) => id !== s.id);
      }

      renderizarListaServicos();
      atualizarResumoServicos();

      // Se já houver uma data escolhida, atualiza os horários disponíveis para a nova duração
      if (dataAgendamento.value) {
        renderizarGradeHorarios(dataAgendamento.value);
      }
    });

    listaServicosContainer.appendChild(item);
  });
}

// 1. Carregar serviços
async function carregarServicos() {
  try {
    const response = await fetch(`${API_URL}/servicos`);
    if (!response.ok) throw new Error("Falha ao carregar serviços");
    catalogoServicos = await response.json();
    renderizarListaServicos();
  } catch (err) {
    listaServicosContainer.innerHTML = '<p style="color: #fca5a5; text-align: center;">Não foi possível carregar os serviços.</p>';
    exibirMensagem("Não foi possível carregar os serviços.", "erro");
  }
}

let requisicaoGradeAtual = 0;

// 2. Montar grade de horários considerando múltiplos blocos consecutivos
async function renderizarGradeHorarios(dataString) {
  const idRequisicao = ++requisicaoGradeAtual;

  gradeHorarios.innerHTML = "";
  horarioSelecionado.value = "";
  btnConfirmar.disabled = true;

  if (!dataString) return;

  try {
    // 1. Consulta a configuração do dia (padrão ou personalizada pela profissional)
    const resDisp = await fetch(`${API_URL}/disponibilidade?data=${dataString}`);
    if (idRequisicao !== requisicaoGradeAtual) return;
    if (!resDisp.ok) throw new Error("Erro ao consultar disponibilidade.");
    const configDia = await resDisp.json();

    if (configDia.diaFechado || !configDia.horarios || configDia.horarios.length === 0) {
      gradeHorarios.innerHTML = '<p style="color: #fca5a5; font-size: 0.9em; grid-column: 1/-1; text-align: center;">Não há atendimento disponível nesta data.</p>';
      return;
    }

    // 2. Busca os agendamentos já marcados naquele dia e mapeia TODOS os slots de 30min ocupados
    const res = await fetch(`${API_URL}/agendamentos?data=${dataString}`);
    if (idRequisicao !== requisicaoGradeAtual) return;
    if (!res.ok) throw new Error(await obterMensagemErro(res));
    const agendados = await res.json();

    const slotsOcupadosSet = new Set();
    agendados.forEach((a) => {
      let cursor = new Date(a.dataHoraInicio);
      const fim = new Date(a.dataHoraFim);
      while (cursor < fim) {
        const hh = String(cursor.getHours()).padStart(2, "0");
        const mm = String(cursor.getMinutes()).padStart(2, "0");
        slotsOcupadosSet.add(`${hh}:${mm}`);
        cursor = new Date(cursor.getTime() + 30 * 60000);
      }
    });

    const horariosAbertosSet = new Set(configDia.horarios);
    const blocosNecessarios = calcularBlocosNecessarios();
    const agora = new Date();
    const horariosJaAdicionados = new Set();
    gradeHorarios.innerHTML = "";

    configDia.horarios.forEach((hora) => {
      if (horariosJaAdicionados.has(hora)) return;
      horariosJaAdicionados.add(hora);

      const dataHoraSlot = new Date(`${dataString}T${hora}:00`);

      // Se o horário já passou, não exibe
      if (dataHoraSlot <= agora) {
        return;
      }

      // Verifica se todos os N blocos consecutivos necessários estão abertos E livres
      let cabeNaGrade = true;
      for (let i = 0; i < blocosNecessarios; i++) {
        const slotVerificar = somarMinutosHorario(hora, i * 30);
        if (!horariosAbertosSet.has(slotVerificar) || slotsOcupadosSet.has(slotVerificar)) {
          cabeNaGrade = false;
          break;
        }
      }

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-horario";
      btn.textContent = hora;

      if (!cabeNaGrade) {
        btn.disabled = true;
        btn.title = "Indisponível para a duração selecionada";
      } else {
        btn.addEventListener("click", () => {
          document.querySelectorAll(".btn-horario").forEach((b) => b.classList.remove("selecionado"));
          btn.classList.add("selecionado");
          horarioSelecionado.value = hora;
          btnConfirmar.disabled = false;
        });
      }
      gradeHorarios.appendChild(btn);
    });

    if (gradeHorarios.children.length === 0) {
      gradeHorarios.innerHTML = '<p style="color: #94a3b8; font-size: 0.9rem; grid-column: 1 / -1; text-align: center;">Não há mais horários disponíveis para hoje. Escolha outra data.</p>';
    }
  } catch (e) {
    if (idRequisicao !== requisicaoGradeAtual) return;
    gradeHorarios.innerHTML = '<p style="color: #dc2626; grid-column: 1/-1;">Erro ao consultar horários disponíveis.</p>';
  }
}

// Elementos do Modal
const modalConfirmacao = document.getElementById("modalConfirmacao");
const resumoModal = document.getElementById("resumoModal");
const btnCancelarModal = document.getElementById("btnCancelarModal");
const btnConfirmarModal = document.getElementById("btnConfirmarModal");

let dadosPendentes = null;

// 3. Envio do Formulário (Abre o card de confirmação)
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const nome = document.getElementById("nomeCliente").value.trim();
  const telefone = document.getElementById("telefoneCliente").value.trim();
  const selecionados = obterServicosSelecionados();
  const data = dataAgendamento.value;
  const hora = horarioSelecionado.value;

  if (nome.length < 4) {
    exibirMensagem("Por favor, digite seu nome completo (mínimo 4 letras).", "erro");
    return;
  }

  const apenasLetras = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;
  if (!apenasLetras.test(nome)) {
    exibirMensagem("O nome deve conter apenas letras.", "erro");
    return;
  }

  const whatsappValido =
    /^[1-9][0-9]9\d{8}$/.test(telefone) &&
    !/^(\d)\1{10}$/.test(telefone) &&
    !/^(\d)\1{7}$/.test(telefone.slice(3));

  if (!whatsappValido) {
    exibirMensagem("Por favor, digite um WhatsApp válido com DDD (ex: 44999998888).", "erro");
    return;
  }

  if (selecionados.length === 0) {
    exibirMensagem("Por favor, selecione pelo menos um serviço.", "erro");
    return;
  }

  if (!data || !hora) {
    exibirMensagem("Por favor, escolha uma data e um horário disponível.", "erro");
    return;
  }

  if (data < hojeISO) {
    exibirMensagem("Por favor, escolha uma data a partir de hoje.", "erro");
    return;
  }

  const [ano, mes, dia] = data.split("-");
  const dataFormatada = `${dia}/${mes}/${ano}`;

  const nomesServicos = selecionados.map((s) => s.nome).join(" + ");
  const duracaoTotal = selecionados.reduce((acc, s) => acc + (s.duracaoMinutos || 30), 0);
  const valorTotal = selecionados.reduce((acc, s) => acc + Number(s.preco || 0), 0);
  const valorFormatado = `R$ ${valorTotal.toFixed(2).replace(".", ",")}`;

  dadosPendentes = {
    nome,
    telefone,
    servicosIds: selecionados.map((s) => s.id),
    nomesServicos,
    valorFormatado,
    data,
    dataFormatada,
    hora
  };

  resumoModal.innerHTML = `
    <div><strong style="color: #fcd34d;">Cliente:</strong> ${nome}</div>
    <div><strong style="color: #fcd34d;">WhatsApp:</strong> ${telefone}</div>
    <div><strong style="color: #fcd34d;">Serviços:</strong> ${nomesServicos}</div>
    <div><strong style="color: #fcd34d;">Duração estimada:</strong> ${duracaoTotal} min</div>
    <div><strong style="color: #fcd34d;">Valor Total:</strong> ${valorFormatado}</div>
    <div><strong style="color: #fcd34d;">Data e Hora:</strong> ${dataFormatada} às ${hora}</div>
  `;

  modalConfirmacao.style.display = "flex";
});

// Botão Cancelar do Modal
btnCancelarModal.addEventListener("click", () => {
  modalConfirmacao.style.display = "none";
  dadosPendentes = null;
});

// Botão Confirmar do Modal (Envia para a API e abre o WhatsApp)
btnConfirmarModal.addEventListener("click", async () => {
  if (!dadosPendentes) return;

  const { nome, telefone, servicosIds, data, dataFormatada, hora } = dadosPendentes;
  btnConfirmarModal.disabled = true;
  btnConfirmarModal.textContent = "Agendando...";

  try {
    const payload = {
      nomeCliente: nome,
      telefoneCliente: telefone,
      servicosIds: servicosIds,
      dataHoraInicio: `${data}T${hora}:00`
    };

    const res = await fetch(`${API_URL}/agendamentos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(await obterMensagemErro(res));
    }

    const agendamentoCriado = await res.json();
    modalConfirmacao.style.display = "none";

    exibirMensagem(`Agendamento de <strong>${nome}</strong> confirmado! Abrindo WhatsApp...`, "sucesso");

    const linkGerenciamento = `${window.location.origin}/meu-agendamento.html?id=${agendamentoCriado.id}`;

    const mensagemWhatsApp =
      `Olá! Acabei de fazer um agendamento pelo site:\n\n` +
      `• *Cliente:* ${agendamentoCriado.nomeCliente}\n` +
      `• *Serviço(s):* ${agendamentoCriado.nomeServico}\n` +
      `• *Data/Horário:* ${dataFormatada} às ${hora}\n` +
      `• *Valor Total:* R$ ${Number(agendamentoCriado.precoServico).toFixed(2).replace(".", ",")}\n\n` +
      `• *Link para gerenciar ou cancelar seu horário:*\n\n${linkGerenciamento}\n\n` +
      `Poderia confirmar, por favor?`;

    form.reset();
    servicosSelecionadosIds = [];
    renderizarListaServicos();
    atualizarResumoServicos();
    gradeHorarios.innerHTML = '<p style="color: #94a3b8; font-size: 0.9em; grid-column: 1 / -1;">Selecione uma data acima para ver os horários.</p>';
    btnConfirmar.disabled = true;

    window.open(
      `https://wa.me/${WHATSAPP_PROFISSIONAL}?text=${encodeURIComponent(mensagemWhatsApp)}`,
      "_blank"
    );
  } catch (err) {
    modalConfirmacao.style.display = "none";
    exibirMensagem(err.message || "Erro ao realizar agendamento.", "erro");
  } finally {
    btnConfirmarModal.disabled = false;
    btnConfirmarModal.textContent = "Confirmar";
    dadosPendentes = null;
  }
});

dataAgendamento.addEventListener("change", () => {
  if (dataAgendamento.value && dataAgendamento.value < hojeISO) {
    exibirMensagem("Não é possível selecionar uma data que já passou.", "erro");
    dataAgendamento.value = hojeISO;
  } else {
    esconderMensagem();
  }
  renderizarGradeHorarios(dataAgendamento.value);
});

btnConfirmar.disabled = true;
carregarServicos();