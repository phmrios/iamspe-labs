/**
 * formatter.js — Formata os dados agrupados por data na saída #LABS:
 *
 * Responsabilidade: receber o objeto { data → campos } já preenchido
 * pelo pipeline e produzir a string final pronta para copiar.
 *
 * Regras de formatação:
 * - Uma linha por data, ordem cronológica decrescente
 * - Campos separados por " / "
 * - LEUCO com diferenciais inline: "LEUCO 6,06 (neut. 4,03 / eos. 0,02 / ...)"
 * - TP composto: "TP 13,6s / Ativ 89% (RNI 1,090)"  ou  "TP Ativ 50,7% (RNI 1,39)"
 * - TTPA composto: "TTPA 37,5s (razão 1,27)"
 * - Gasometria: "GasoV: pH 7,215 / pCO2 45,4 / pO2 28,9 / HCO3 18 / BE -9,8 / sO2 46,7"
 * - Qualitativas: "HBsAg NR"
 * - Microbiológicos: "CultAerobia(LBA) NEG"  ou  "CultFungo(LBA) POS: Fungo filamentoso..."
 */

"use strict";

/* ─── Formatadores de campos compostos ──────────────────────── */

function formatLeuco(data) {
  if (!data["LEUCO"]) return null;

  const presentSubs = LEUCO_ORDER.filter(sub => data[sub]);
  let str = `LEUCO ${data["LEUCO"]}`;

  if (presentSubs.length > 0) {
    const subsStr = presentSubs
      .map(sub => `${LEUCO_LABELS[sub]} ${data[sub]}`)
      .join(" / ");
    str += ` (${subsStr})`;
  }

  return str;
}

function formatTP(data) {
  // Precisa de pelo menos ativ% ou RNI para exibir
  if (!data["TP_seg"] && !data["TP_ativ"] && !data["RNI"]) return null;

  const parts = ["TP"];
  // Ambulatório tem segundos; Biofast não — não colocar separador desnecessário
  if (data["TP_seg"])  parts.push(`${data["TP_seg"]}s`);
  if (data["TP_ativ"]) parts.push(`Ativ ${data["TP_ativ"]}%`);

  let str = parts.join(" ");
  if (data["RNI"]) str += ` (RNI ${data["RNI"]})`;

  return str;
}

function formatTTPA(data) {
  if (!data["TTPA_seg"] && !data["TTPA_razao"]) return null;

  let str = "TTPA";
  if (data["TTPA_seg"])   str += ` ${data["TTPA_seg"]}s`;
  if (data["TTPA_razao"]) str += ` (razão ${data["TTPA_razao"]})`;

  return str;
}

/**
 * Formata um bloco de gasometria.
 * @param {string} prefix - "GasoV", "GasoA" ou "GasoC"
 * @param {Object} data   - dados da data atual
 */
function formatGasometria(prefix, data) {
  const presentParams = GASO_ORDER.filter(param => data[param] !== undefined);
  if (presentParams.length === 0) return null;

  const paramsStr = presentParams
    .map(param => `${GASO_LABELS[param]} ${data[param]}`)
    .join(" / ");

  return `${prefix}: ${paramsStr}`;
}

function formatQualitativa(key, data) {
  const value = data._quals?.[key];
  if (!value) return null;
  return `${QUAL_LABELS[key]} ${value}`;
}

function formatMicrobiologico(entry) {
  const { key, material, resultado, microorg } = entry;
  const label     = MICRO_LABELS[key] || key;
  const matSuffix = material ? `(${material})` : "";
  const qual      = normalizeQual(resultado);

  let str = `${label}${matSuffix} ${qual}`;

  // Exibir microorganismo apenas quando positivo
  if (qual === "POS" && microorg) {
    str += `: ${microorg.slice(0, 40)}`;
  }

  return str;
}

/* ─── Formatador principal ───────────────────────────────────── */

/**
 * Produz a string #LABS: completa a partir do objeto agrupado por data.
 *
 * @param {Object} byDate - { "dd/mm/aaaa": { campos..., _quals, _micros, _gasos } }
 * @returns {string}
 */
function formatLabsOutput(byDate) {
  // Ordenar datas decrescente (mais recente primeiro)
  const sortedDates = Object.keys(byDate).sort((a, b) =>
    dateToSortKey(b).localeCompare(dateToSortKey(a))
  );

  const outputLines = ["#LABS:"];

  for (const date of sortedDates) {
    const data  = byDate[date];
    const parts = [];

    for (const key of OUTPUT_ORDER) {
      // ── Campos compostos especiais
      if (key === "LEUCO") {
        const str = formatLeuco(data);
        if (str) parts.push(str);
        continue;
      }

      if (key === "TP") {
        const str = formatTP(data);
        if (str) parts.push(str);
        continue;
      }

      if (key === "TTPA") {
        const str = formatTTPA(data);
        if (str) parts.push(str);
        continue;
      }

      // ── Gasometrias (por tipo de coleta)
      if (key === "GasoV" || key === "GasoA" || key === "GasoC") {
        const gasoData = data._gasos?.[key];
        if (!gasoData) continue;
        const str = formatGasometria(key, gasoData);
        if (str) parts.push(str);
        continue;
      }

      // ── Sorologias qualitativas
      if (key.startsWith("_QUAL_")) {
        const str = formatQualitativa(key, data);
        if (str) parts.push(str);
        continue;
      }

      // ── Campo numérico simples
      if (data[key] !== undefined) {
        parts.push(`${key} ${data[key]}`);
      }
    }

    // ── Microbiológicos ao final (ordem de aparição no laudo)
    if (data._micros?.length > 0) {
      for (const entry of data._micros) {
        const str = formatMicrobiologico(entry);
        if (str) parts.push(str);
      }
    }

    if (parts.length > 0) {
      outputLines.push(`${date}: ${parts.join(" / ")}`);
    }
  }

  return outputLines.join("\n");
}
