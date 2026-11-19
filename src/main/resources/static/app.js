const API_URL = "https://sistema-agendamento-studio.onrender.com";
const WHATSAPP_PROFISSIONAL = "5544998375875";

const GRADE_EXPEDIENTE = ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"];

const servicoSelect = document.getElementById("servicoSelect");
const form = document.getElementById("formAgendamento");
const mensagemBox = document.getElementById("mensagemBox");
const dataAgendamento = document.getElementById("dataAgendamento");
const gradeHorarios = document.getElementById("gradeHorarios");
const horarioSelecionado = document.getElementById("horarioSelecionado");
const btnConfirmar = document.getElementById("btnConfirmar");

const hoje = new Date();
const ano = hoje.getFullYear();
const mes = String(hoje.getMonth() + 1).padStart(2, "0");
const dia = String(hoje.getDate()).padStart(2, "0");
const hojeISO = `${ano}-${mes}-${dia}`;
dataAgendamento.min = hojeISO;

function formatarDataBrasil(dataIso) {
  if (!dataIso) return "";
  const dataObj = new Date(dataIso);
  return dataObj
    .toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(",", " às");
}

function extrairHorario(dataIso) {
  if (!dataIso) return "";
  const dataObj = new Date(dataIso);
  return dataObj.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
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

// 1. Carregar serviços
async function carregarServicos() {
  try {
    const response = await fetch(`${API_URL}/servicos`);
    if (!response.ok) throw new Error("Falha ao carregar serviços");
    const servicos = await response.json();

    servicoSelect.innerHTML = '<option value="">Selecione um serviço...</option>';
    servicos.forEach((s) => {
      const option = document.createElement("option");
      option.value = s.id;
      option.textContent = `${s.nome} - R$ ${s.preco.toFixed(2).replace(".", ",")}`;
      servicoSelect.appendChild(option);
    });
  } catch (err) {
    exibirMensagem("Não foi possível carregar os serviços.", "erro");
  }
}

let requisicaoGradeAtual = 0;

// 2. Montar grade de horários
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

    // 2. Busca os agendamentos já marcados naquele dia para bloquear os ocupados
    const res = await fetch(`${API_URL}/agendamentos?data=${dataString}`);
    if (idRequisicao !== requisicaoGradeAtual) return;
    if (!res.ok) throw new Error(await obterMensagemErro(res));
    const agendados = await res.json();
    const horariosOcupados = agendados.map((a) => extrairHorario(a.dataHoraInicio));

    const agora = new Date();
    const horariosJaAdicionados = new Set();
    gradeHorarios.innerHTML = "";

    configDia.horarios.forEach((hora) => {
      if (horariosJaAdicionados.has(hora)) return;
      horariosJaAdicionados.add(hora);

      const dataHoraSlot = new Date(`${dataString}T${hora}:00`);

      // Se o horário já passou, nem cria o botão na grade
      if (dataHoraSlot <= agora) {
        return;
      }

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-horario";
      btn.textContent = hora;

      if (horariosOcupados.includes(hora)) {
        btn.disabled = true;
        btn.title = "Horário indisponível";
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
  const servicoId = servicoSelect.value;
  const servicoTexto = servicoSelect.options[servicoSelect.selectedIndex]?.text || "";
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

  if (!servicoId || !data || !hora) {
    exibirMensagem("Por favor, preencha todos os campos e escolha um horário.", "erro");
    return;
  }

  if (data < hojeISO) {
    exibirMensagem("Por favor, escolha uma data a partir de hoje.", "erro");
    return;
  }

  const [ano, mes, dia] = data.split("-");
  const dataFormatada = `${dia}/${mes}/${ano}`;

  dadosPendentes = {
    nome,
    telefone,
    servicoId: Number(servicoId),
    servicoTexto,
    data,
    dataFormatada,
    hora
  };

  resumoModal.innerHTML = `
    <div><strong style="color: #fcd34d;">Cliente:</strong> ${nome}</div>
    <div><strong style="color: #fcd34d;">WhatsApp:</strong> ${telefone}</div>
    <div><strong style="color: #fcd34d;">Serviço:</strong> ${servicoTexto}</div>
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

  const { nome, telefone, servicoId, servicoTexto, data, dataFormatada, hora } = dadosPendentes;
  btnConfirmarModal.disabled = true;
  btnConfirmarModal.textContent = "Agendando...";

  try {
    const payload = {
      nomeCliente: nome,
      telefoneCliente: telefone,
      servicoId: servicoId,
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
      `• *Serviço:* ${agendamentoCriado.nomeServico}\n` +
      `• *Data/Horário:* ${dataFormatada} às ${hora}\n` +
      `• *Valor:* R$ ${Number(agendamentoCriado.precoServico).toFixed(2).replace(".", ",")}\n\n` +
      `• *Link para gerenciar ou cancelar seu horário:*\n\n${linkGerenciamento}\n\n` +
      `Poderia confirmar, por favor?`;

    form.reset();
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