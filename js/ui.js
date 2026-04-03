/**
 * ui.js — Interação com o DOM
 *
 * Responsabilidade: conectar os eventos da interface ao pipeline
 * de processamento. Não contém lógica de parsing ou formatação.
 *
 * Inicializado após DOMContentLoaded.
 */

"use strict";

/* ─── Referências ao DOM ─────────────────────────────────────── */

const elInput    = document.getElementById("input-laudo");
const elOutput   = document.getElementById("output-box");
const elSection  = document.getElementById("output-section");
const btnProcess = document.getElementById("btn-processar");
const btnCopy    = document.getElementById("btn-copiar");
const btnClear   = document.getElementById("btn-limpar");
const btnExample = document.getElementById("btn-exemplo");
const msgError   = document.getElementById("msg-error");
const msgWarn    = document.getElementById("msg-warn");
const msgSuccess = document.getElementById("msg-success");
const msgInfo    = document.getElementById("msg-info");
const liveRegion = document.getElementById("live-region");

/* ─── Utilitários de mensagem ────────────────────────────────── */

function hideAllMessages() {
  [msgError, msgWarn, msgSuccess, msgInfo].forEach(el => {
    el.classList.remove("visible");
    el.textContent = "";
  });
}

function showMessage(element, text) {
  hideAllMessages();
  element.textContent = text;
  element.classList.add("visible");
  // Anuncia para leitores de tela via live region dedicada
  liveRegion.textContent = text;
}

function announce(text) {
  // Limpa e reatribui para garantir que o leitor de tela dispare
  liveRegion.textContent = "";
  requestAnimationFrame(() => { liveRegion.textContent = text; });
}

/* ─── Ações dos botões ───────────────────────────────────────── */

function handleProcess() {
  const raw = elInput.value.trim();
  if (!raw) {
    showMessage(msgError, "Nenhum texto informado. Cole o conteúdo do laudo no campo acima.");
    elInput.focus();
    return;
  }

  hideAllMessages();

  let result;
  try {
    result = processLabText(raw);
  } catch (err) {
    showMessage(msgError, `Erro interno no processamento: ${err.message}.`);
    return;
  }

  const hasContent = result.output &&
                     result.output !== "#LABS:" &&
                     result.dateCount > 0;

  if (!hasContent) {
    showMessage(msgError,
      "Nenhum exame reconhecido. " +
      "Confira se o texto foi copiado integralmente do laudo."
    );
    setOutputVisible(false);
    return;
  }

  elOutput.textContent = result.output;
  setOutputVisible(true);

  const successText = `${result.dateCount} data(s) · ${result.recognizedCount} bloco(s) processado(s).`;
  showMessage(msgSuccess, successText);

  if (result.ignoredCount > 0) {
    // Exibe aviso complementar sem apagar a mensagem de sucesso
    setTimeout(() => {
      msgWarn.textContent = `${result.ignoredCount} bloco(s) ignorados (sem data ou fora do escopo da v3).`;
      msgWarn.classList.add("visible");
    }, 80);
  }

  announce(`Processado. ${successText}`);
  elSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function handleCopy() {
  const text = elOutput.textContent;
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    btnCopy.textContent = "✓ Copiado!";
    announce("Saída copiada para a área de transferência.");
    setTimeout(() => { btnCopy.textContent = "Copiar saída"; }, 2000);
  } catch {
    // Fallback para navegadores sem permissão de clipboard
    const range = document.createRange();
    range.selectNodeContents(elOutput);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    showMessage(msgInfo, "Selecione o texto e use Ctrl+C / Cmd+C para copiar.");
  }
}

function handleClear() {
  elInput.value = "";
  elOutput.textContent = "";
  setOutputVisible(false);
  hideAllMessages();
  elInput.focus();
  announce("Campo limpo.");
}

function handleLoadExample() {
  elInput.value = EXEMPLO;
  hideAllMessages();
  showMessage(msgInfo, "Exemplo carregado. Clique em Processar.");
  elInput.focus();
  announce("Texto de exemplo carregado.");
}

/* ─── Visibilidade da seção de saída ─────────────────────────── */

function setOutputVisible(visible) {
  elOutput.classList.toggle("visible", visible);
  elSection.hidden = !visible;
  btnCopy.disabled = !visible;
  btnCopy.setAttribute("aria-disabled", String(!visible));
}

/* ─── Sistema de abas ────────────────────────────────────────── */

function activateTab(targetTab) {
  const tabs   = Array.from(document.querySelectorAll("[role='tab']"));
  const panels = Array.from(document.querySelectorAll("[role='tabpanel']"));

  tabs.forEach(tab => {
    const isSelected = tab === targetTab;
    tab.setAttribute("aria-selected", String(isSelected));
    tab.tabIndex = isSelected ? 0 : -1;
  });

  panels.forEach(panel => {
    panel.classList.toggle("active", panel.id === targetTab.getAttribute("aria-controls"));
  });
}

function initTabs() {
  const tabs = Array.from(document.querySelectorAll("[role='tab']"));

  tabs.forEach(tab => {
    tab.addEventListener("click", () => activateTab(tab));

    tab.addEventListener("keydown", e => {
      const idx = tabs.indexOf(e.currentTarget);
      let newIdx = idx;

      switch (e.key) {
        case "ArrowRight": newIdx = (idx + 1) % tabs.length; break;
        case "ArrowLeft":  newIdx = (idx - 1 + tabs.length) % tabs.length; break;
        case "Home":       newIdx = 0; break;
        case "End":        newIdx = tabs.length - 1; break;
        default: return;
      }

      e.preventDefault();
      tabs[newIdx].focus();
      activateTab(tabs[newIdx]);
    });
  });
}

/* ─── Inicialização ──────────────────────────────────────────── */

document.addEventListener("DOMContentLoaded", () => {
  btnProcess.addEventListener("click", handleProcess);
  btnCopy.addEventListener("click", handleCopy);
  btnClear.addEventListener("click", handleClear);
  btnExample.addEventListener("click", handleLoadExample);
  initTabs();
});
