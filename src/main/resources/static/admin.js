const API_URL = "https://sistema-agendamento-studio.onrender.com";
let senhaAdminAtual = localStorage.getItem("adminPassword") || "";

function getHeadersAdmin() {
  return {
    "Content-Type": "application/json",
    "X-Admin-Password": senhaAdminAtual
  };
}

const telaLogin = document.getElementById("telaLogin");
const formLogin = document.getElementById("formLogin");
const senhaInput = document.getElementById("senhaInput");
const painelAdmin = document.getElementById("painelAdmin");

const agendaAgrupada = document.getElementById("agendaAgrupada");
const mensagemBox = document.getElementById("mensagemBox");

// Elementos de Configuração de Disponibilidade
const dataConfig = document.getElementById("dataConfig");
const checkDiaFechado = document.getElementById("checkDiaFechado");
const areaHorariosConfig = document.getElementById("areaHorariosConfig");
const gradeHorariosAdmin = document.getElementById("gradeHorariosAdmin");
const btnSalvarDisp = document.getElementById("btnSalvarDisp");
const mensagemDispBox = document.getElementById("mensagemDispBox");

const TODOS_HORARIOS_POSSIVEIS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00",
  "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00"
];

let horariosAtivosNoDia = new Set();
let todosAgendamentos = [];

// 1. Controle de Login
function liberarPainel() {
  telaLogin.style.display = "none";
  painelAdmin.style.display = "block";
  inicializarConfiguracaoDia();
  carregarTodosAgendamentos();
}

const erroLogin = document.getElementById("erroLogin");

if (senhaAdminAtual) {
  liberarPainel();
}

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  const senhaDigitada = senhaInput.value.trim();
  if (erroLogin) erroLogin.style.display = "none";

  try {
    const res = await fetch(`${API_URL}/agendamentos`, {
      headers: { "X-Admin-Password": senhaDigitada }
    });

    if (res.ok) {
      senhaAdminAtual = senhaDigitada;
      localStorage.setItem("adminPassword", senhaDigitada);
      liberarPainel();
    } else {
      if (erroLogin) {
        erroLogin.textContent = "Senha incorreta. Tente novamente.";
        erroLogin.style.display = "block";
      }
      senhaInput.value = "";
      senhaInput.focus();
    }
  } catch (err) {
    if (erroLogin) {
      erroLogin.textContent = "Não foi possível conectar ao servidor.";
      erroLogin.style.display = "block";
    }
  }
});

function exibirMensagem(elemento, texto, tipo) {
  elemento.innerHTML = texto;
  elemento.className = `mensagem ${tipo}`;
  elemento.style.display = "block";
  setTimeout(() => {
    elemento.style.display = "none";
  }, 5000);
}

function formatarDataLocal(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

// 2. Controle de Horários e Folgas
function inicializarConfiguracaoDia() {
  const hoje = formatarDataLocal(new Date());
  dataConfig.value = hoje;
  carregarConfiguracaoDoDia(hoje);

  dataConfig.addEventListener("change", () => {
    carregarConfiguracaoDoDia(dataConfig.value);
  });

  checkDiaFechado.addEventListener("change", () => {
    areaHorariosConfig.style.display = checkDiaFechado.checked ? "none" : "block";
  });

  btnSalvarDisp.addEventListener("click", salvarConfiguracaoDoDia);
}

async function carregarConfiguracaoDoDia(dataString) {
  if (!dataString) return;
  try {
    const res = await fetch(`${API_URL}/disponibilidade?data=${dataString}`);
    if (!res.ok) throw new Error();

    const dados = await res.json();
    checkDiaFechado.checked = dados.diaFechado;
    areaHorariosConfig.style.display = dados.diaFechado ? "none" : "block";

    horariosAtivosNoDia = new Set(dados.horarios || []);
    renderizarGradeHorariosAdmin();
  } catch (err) {
    exibirMensagem(mensagemDispBox, "Erro ao carregar configuração do dia.", "erro");
  }
}

function renderizarGradeHorariosAdmin() {
  gradeHorariosAdmin.innerHTML = "";
  TODOS_HORARIOS_POSSIVEIS.forEach((hora) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = hora;
    btn.className = "btn-horario";
    if (horariosAtivosNoDia.has(hora)) {
      btn.classList.add("selecionado");
    }

    btn.addEventListener("click", () => {
      if (horariosAtivosNoDia.has(hora)) {
        horariosAtivosNoDia.delete(hora);
        btn.classList.remove("selecionado");
      } else {
        horariosAtivosNoDia.add(hora);
        btn.classList.add("selecionado");
      }
    });

    gradeHorariosAdmin.appendChild(btn);
  });
}

async function salvarConfiguracaoDoDia() {
  const dataSelecionada = dataConfig.value;
  if (!dataSelecionada) return;

  const horariosOrdenados = Array.from(horariosAtivosNoDia).sort();
  const payload = {
    data: dataSelecionada,
    diaFechado: checkDiaFechado.checked,
    horarios: horariosOrdenados
  };

  try {
    const response = await fetch(`${API_URL}/disponibilidade`, {
      method: "POST",
      headers: getHeadersAdmin(),
      body: JSON.stringify(payload)
});

    if (response.ok) {
      exibirMensagem(mensagemDispBox, "Disponibilidade salva com sucesso!", "sucesso");
    } else {
      exibirMensagem(mensagemDispBox, "Erro ao salvar disponibilidade.", "erro");
    }
  } catch (err) {
    exibirMensagem(mensagemDispBox, "Falha de conexão ao salvar.", "erro");
  }
}

// 3. Agenda Completa Agrupada
function extrairHorario(dataIso) {
  if (!dataIso) return "";
  const dataObj = new Date(dataIso);
  return dataObj.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarTituloDia(dataChave) {
  const [ano, mes, dia] = dataChave.split("-").map(Number);
  const dataObj = new Date(ano, mes - 1, dia);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const amanha = new Date(hoje);
  amanha.setDate(hoje.getDate() + 1);

  const diaSemana = dataObj.toLocaleDateString("pt-BR", { weekday: "long" });
  const diaSemanaCapitalizado = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
  const dataFormatada = `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;

  if (dataObj.getTime() === hoje.getTime()) {
    return `HOJE • ${diaSemanaCapitalizado} (${dataFormatada})`;
  } else if (dataObj.getTime() === amanha.getTime()) {
    return `AMANHÃ • ${diaSemanaCapitalizado} (${dataFormatada})`;
  }
  return `${diaSemanaCapitalizado} • ${dataFormatada}`;
}

    async function carregarTodosAgendamentos() {
    try {
      const response = await fetch(`${API_URL}/agendamentos`, {
      headers: getHeadersAdmin()
    });

    if (response.status === 401) {
      localStorage.removeItem("adminPassword");
      senhaAdminAtual = "";
      telaLogin.style.display = "flex";
      painelAdmin.style.display = "none";
      return;
    }
    if (!response.ok) throw new Error("Erro ao buscar agenda.");

    todosAgendamentos = await response.json();
    agendaAgrupada.innerHTML = "";

    if (todosAgendamentos.length === 0) {
      agendaAgrupada.innerHTML = `
        <p style="text-align: center; color: #94a3b8; padding: 20px;">
          Nenhum agendamento futuro encontrado.
        </p>`;
      return;
    }

    todosAgendamentos.sort((a, b) => a.dataHoraInicio.localeCompare(b.dataHoraInicio));

    const gruposPorData = {};
    todosAgendamentos.forEach((ag) => {
      const dataChave = ag.dataHoraInicio.split("T")[0];
      if (!gruposPorData[dataChave]) {
        gruposPorData[dataChave] = [];
      }
      gruposPorData[dataChave].push(ag);
    });

    Object.keys(gruposPorData).forEach((dataChave) => {
      const listaDoDia = gruposPorData[dataChave];
      const tituloDia = formatarTituloDia(dataChave);

      const blocoDia = document.createElement("div");
      blocoDia.style.marginBottom = "30px";

      let linhasTabela = "";
      listaDoDia.forEach((ag) => {
        const horaInicio = extrairHorario(ag.dataHoraInicio);
        const horaFim = ag.dataHoraFim ? extrairHorario(ag.dataHoraFim) : "";
        const horarioExibicao = horaFim ? `${horaInicio} - ${horaFim}` : horaInicio;
        const telefoneLimpo = ag.telefoneCliente.replace(/\D/g, "");
        const valorFormatado = ag.precoServico != null
          ? `R$ ${Number(ag.precoServico).toFixed(2).replace(".", ",")}`
          : "";

        const classeLinha =
          ag.status === "CONCLUIDO"
            ? "linha-concluida"
            : ag.status === "CANCELADO"
            ? "linha-cancelada"
            : "";

        linhasTabela += `
          <tr class="${classeLinha}">
            <td><strong style="color: #94a3b8;">#${ag.id}</strong></td>
            <td style="white-space: nowrap;"><strong style="color: #fcd34d;">${horarioExibicao}</strong></td>
            <td><strong>${ag.nomeCliente}</strong></td>
            <td>
              <a href="https://wa.me/55${telefoneLimpo}" target="_blank" style="text-decoration: none; font-weight: bold;">
                ${ag.telefoneCliente}
              </a>
            </td>
            <td>
              <div>${ag.nomeServico}</div>
              ${valorFormatado ? `<small style="color: #94a3b8;">${valorFormatado}</small>` : ""}
            </td>
            <td><span class="status-badge status-${ag.status}">${ag.status}</span></td>
            <td>
              ${ag.status === "CONFIRMADO" ? `
                <div style="display: flex; gap: 6px;">
                  <button type="button" class="btn-concluir" onclick="concluirAgendamento(${ag.id})">
                    Concluir
                  </button>
                  <button type="button" class="btn-cancelar" onclick="cancelarAgendamento(${ag.id})">
                    Cancelar
                  </button>
                </div>
              ` : `<span style="color: #64748b; font-size: 0.85rem;">—</span>`}
            </td>
          </tr>
        `;
      });

      blocoDia.innerHTML = `
        <div style="
          background: rgba(245, 158, 11, 0.12);
          border-left: 4px solid #f59e0b;
          padding: 10px 15px;
          border-radius: 6px;
          margin-bottom: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <span style="color: #fde047; font-weight: 700; font-size: 0.95rem; letter-spacing: 0.5px;">
            ${tituloDia}
          </span>
          <span style="color: #cbd5e1; font-size: 0.82rem;">
            ${listaDoDia.length} ${listaDoDia.length === 1 ? "cliente" : "clientes"}
          </span>
        </div>

        <div class="tabela-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Horário</th>
                <th>Cliente</th>
                <th>WhatsApp</th>
                <th>Serviço</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              ${linhasTabela}
            </tbody>
          </table>
        </div>
      `;

      agendaAgrupada.appendChild(blocoDia);
    });
  } catch (err) {
    agendaAgrupada.innerHTML = `
      <p style="text-align: center; color: #fca5a5;">
        Erro de conexão ao carregar a agenda.
      </p>`;
  }
}

const modalCancelAdmin = document.getElementById("modalCancelAdmin");
const textoModalCancelAdmin = document.getElementById("textoModalCancelAdmin");
const btnVoltarCancelAdmin = document.getElementById("btnVoltarCancelAdmin");
const btnConfirmarCancelAdmin = document.getElementById("btnConfirmarCancelAdmin");

let idParaCancelarAdmin = null;

window.cancelarAgendamento = function (id) {
  const ag = todosAgendamentos.find((item) => item.id === id);
  if (!ag) return;

  idParaCancelarAdmin = id;
  textoModalCancelAdmin.innerHTML = `Deseja realmente cancelar o agendamento <strong style="color: #fcd34d;">#${ag.id}</strong> de <strong style="color: #fcd34d;">${ag.nomeCliente}</strong>?`;
  modalCancelAdmin.style.display = "flex";
};

btnVoltarCancelAdmin.addEventListener("click", () => {
  modalCancelAdmin.style.display = "none";
  idParaCancelarAdmin = null;
});

btnConfirmarCancelAdmin.addEventListener("click", async () => {
  if (!idParaCancelarAdmin) return;

  const ag = todosAgendamentos.find((item) => item.id === idParaCancelarAdmin);
  btnConfirmarCancelAdmin.disabled = true;
  btnConfirmarCancelAdmin.textContent = "Cancelando...";

  try {
    const response = await fetch(`${API_URL}/agendamentos/${idParaCancelarAdmin}/cancelar`, {
      method: "PATCH",
    });

    if (response.ok) {
      modalCancelAdmin.style.display = "none";
      exibirMensagem(mensagemBox, `Agendamento <strong>#${idParaCancelarAdmin}</strong> de <strong>${ag ? ag.nomeCliente : ""}</strong> cancelado e horário liberado!`, "sucesso");
      carregarTodosAgendamentos();
    } else {
      modalCancelAdmin.style.display = "none";
      const msg = await response.text();
      exibirMensagem(mensagemBox, `Erro ao cancelar: ${msg}`, "erro");
    }
  } catch (err) {
    modalCancelAdmin.style.display = "none";
    exibirMensagem(mensagemBox, "Falha de conexão ao tentar cancelar.", "erro");
  } finally {
    btnConfirmarCancelAdmin.disabled = false;
    btnConfirmarCancelAdmin.textContent = "Sim, Cancelar";
    idParaCancelarAdmin = null;
  }
});

const modalConcluirAdmin = document.getElementById("modalConcluirAdmin");
const textoModalConcluirAdmin = document.getElementById("textoModalConcluirAdmin");
const btnVoltarConcluirAdmin = document.getElementById("btnVoltarConcluirAdmin");
const btnConfirmarConcluirAdmin = document.getElementById("btnConfirmarConcluirAdmin");

let idParaConcluirAdmin = null;

window.concluirAgendamento = function (id) {
  const ag = todosAgendamentos.find((item) => item.id === id);
  if (!ag) return;

  idParaConcluirAdmin = id;
  textoModalConcluirAdmin.innerHTML = `Deseja marcar como concluído o atendimento <strong style="color: #34d399;">#${ag.id}</strong> de <strong style="color: #fcd34d;">${ag.nomeCliente}</strong>?`;
  modalConcluirAdmin.style.display = "flex";
};

btnVoltarConcluirAdmin.addEventListener("click", () => {
  modalConcluirAdmin.style.display = "none";
  idParaConcluirAdmin = null;
});

btnConfirmarConcluirAdmin.addEventListener("click", async () => {
  if (!idParaConcluirAdmin) return;

  const ag = todosAgendamentos.find((item) => item.id === idParaConcluirAdmin);
  btnConfirmarConcluirAdmin.disabled = true;
  btnConfirmarConcluirAdmin.textContent = "Concluindo...";

  try {
    const response = await fetch(`${API_URL}/agendamentos/${idParaConcluirAdmin}/concluir`, {
      method: "PATCH",
      headers: getHeadersAdmin()
    });

    if (response.ok) {
      modalConcluirAdmin.style.display = "none";
      exibirMensagem(mensagemBox, `Atendimento <strong>#${idParaConcluirAdmin}</strong> de <strong>${ag ? ag.nomeCliente : ""}</strong> marcado como concluído!`, "sucesso");
      carregarTodosAgendamentos();
    } else {
      modalConcluirAdmin.style.display = "none";
      exibirMensagem(mensagemBox, "Erro ao concluir atendimento.", "erro");
    }
  } catch (err) {
    modalConcluirAdmin.style.display = "none";
    exibirMensagem(mensagemBox, "Falha de conexão ao tentar concluir.", "erro");
  } finally {
    btnConfirmarConcluirAdmin.disabled = false;
    btnConfirmarConcluirAdmin.textContent = "Sim, Concluir";
    idParaConcluirAdmin = null;
  }
});