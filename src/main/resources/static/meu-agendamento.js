const API_URL = "https://sistema-agendamento-studio.onrender.com";
const WHATSAPP_PROFISSIONAL = "5544998375875";

const params = new URLSearchParams(window.location.search);
const agendamentoId = params.get("id");
const avisoWhatsApp = document.getElementById("avisoWhatsApp");

const carregando = document.getElementById("carregando");
const conteudoAgendamento = document.getElementById("conteudoAgendamento");
const mensagemBox = document.getElementById("mensagemBox");

const infoId = document.getElementById("infoId");
const infoCliente = document.getElementById("infoCliente");
const infoServico = document.getElementById("infoServico");
const infoDataHora = document.getElementById("infoDataHora");
const infoStatus = document.getElementById("infoStatus");
const btnCancelar = document.getElementById("btnCancelar");

function exibirMensagem(texto, tipo) {
  mensagemBox.innerHTML = texto;
  mensagemBox.className = `mensagem ${tipo}`;
  mensagemBox.style.display = "block";
}

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

async function carregarDetalhes() {
  if (!agendamentoId) {
    carregando.style.display = "none";
    exibirMensagem("Código de agendamento não informado no link.", "erro");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/agendamentos/${agendamentoId}`);
    if (!res.ok) {
      carregando.style.display = "none";
      exibirMensagem("Agendamento não encontrado.", "erro");
      return;
    }

    const ag = await res.json();
    carregando.style.display = "none";

    infoId.textContent = `#${ag.id}`;
    infoCliente.textContent = ag.nomeCliente;
    infoServico.textContent = ag.nomeServico;
    infoDataHora.textContent = formatarDataBrasil(ag.dataHoraInicio);
    infoStatus.textContent = ag.status;
    infoStatus.className = `status-badge status-${ag.status}`;

    if (ag.status === "CANCELADO") {
    btnCancelar.disabled = true;
    btnCancelar.textContent = "Agendamento Cancelado";
    btnCancelar.style.opacity = "0.5";
    btnCancelar.style.cursor = "not-allowed";
    if (avisoWhatsApp) avisoWhatsApp.style.display = "none";
  
  } else if (ag.status === "CONCLUIDO") {
  btnCancelar.disabled = true;
  btnCancelar.textContent = "Agendamento Concluído";
  btnCancelar.style.setProperty("background-color", "rgba(16, 185, 129, 0.15)", "important");
  btnCancelar.style.setProperty("color", "#34d399", "important");
  btnCancelar.style.setProperty("border-color", "rgba(16, 185, 129, 0.4)", "important");
  btnCancelar.style.setProperty("opacity", "1", "important");
  btnCancelar.style.cursor = "default";
  if (avisoWhatsApp) avisoWhatsApp.style.display = "none";
}

    conteudoAgendamento.style.display = "block";
  } catch (err) {
    carregando.style.display = "none";
    exibirMensagem("Erro ao conectar com o servidor.", "erro");
  }
}

const modalCancelamento = document.getElementById("modalCancelamento");
const codigoModalCancelamento = document.getElementById("codigoModalCancelamento");
const btnFecharModalCancel = document.getElementById("btnFecharModalCancel");
const btnConfirmarCancel = document.getElementById("btnConfirmarCancel");

// 1. Abre o card ao clicar em "Cancelar Agendamento"
btnCancelar.addEventListener("click", () => {
  codigoModalCancelamento.textContent = `#${agendamentoId}`;
  modalCancelamento.style.display = "flex";
});

// 2. Fecha o card ao clicar em "Voltar"
btnFecharModalCancel.addEventListener("click", () => {
  modalCancelamento.style.display = "none";
});

// 3. Executa o cancelamento ao clicar em "Sim, Cancelar"
btnConfirmarCancel.addEventListener("click", async () => {
  btnConfirmarCancel.disabled = true;
  btnConfirmarCancel.textContent = "Cancelando...";

  try {
    const res = await fetch(`${API_URL}/agendamentos/${agendamentoId}/cancelar`, {
      method: "PATCH",
    });

    if (res.ok) {
      modalCancelamento.style.display = "none";
      exibirMensagem("Agendamento cancelado com sucesso! Abrindo WhatsApp...", "sucesso");
      await carregarDetalhes();

      const cliente = document.getElementById("infoCliente").textContent;
      const servico = document.getElementById("infoServico").textContent;
      const dataHora = document.getElementById("infoDataHora").textContent;

      const aviso =
        `*AVISO DE CANCELAMENTO*\n\n` +
        `Olá! O seguinte agendamento foi cancelado:\n\n` +
        `• *Cliente:* ${cliente}\n` +
        `• *Serviço:* ${servico}\n` +
        `• *Data/Horário:* ${dataHora}\n` +
        `• *Código:* #${agendamentoId}\n\n` +
        `O horário já foi liberado no sistema.`;

      window.open(
        `https://wa.me/${WHATSAPP_PROFISSIONAL}?text=${encodeURIComponent(aviso)}`,
        "_blank"
      );
    } else {
      modalCancelamento.style.display = "none";
      const msg = await res.text();
      exibirMensagem(`Erro ao cancelar: ${msg}`, "erro");
    }
  } catch (err) {
    modalCancelamento.style.display = "none";
    exibirMensagem("Falha de conexão ao tentar cancelar.", "erro");
  } finally {
    btnConfirmarCancel.disabled = false;
    btnConfirmarCancel.textContent = "Sim, Cancelar";
  }
});

carregarDetalhes();