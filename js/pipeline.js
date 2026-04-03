/**
 * pipeline.js — Orquestra o processamento de ponta a ponta
 *
 * Responsabilidade: coordenar a sequência de etapas e acumular
 * os resultados de cada bloco na estrutura agrupada por data.
 *
 * Não contém lógica de parsing nem de formatação.
 * Não acessa o DOM.
 *
 * Fluxo:
 *   texto bruto
 *     → sanitizeRawText
 *     → removeNoise
 *     → splitIntoBlocks
 *     → [para cada bloco] extractCollectionDate + resolveBlockAlias + parser correto
 *     → mergeByDate (acumula sem sobrescrever)
 *     → formatLabsOutput
 *     → { output, recognizedCount, ignoredCount, dateCount }
 */

"use strict";

/* ─── Acumulador de dados por data ───────────────────────────── */

/**
 * Garante que a estrutura da data exista no acumulador.
 * _quals: sorologias qualitativas { chave_QUAL → "NR" | "R" | ... }
 * _micros: microbiológicos [ { key, material, resultado, microorg } ]
 * _gasos: gasometrias { "GasoV" | "GasoA" | "GasoC" → { Gaso_pH, ... } }
 */
function ensureDateEntry(byDate, date) {
  if (!byDate[date]) {
    byDate[date] = { _quals: {}, _micros: [], _gasos: {} };
  }
}

/**
 * Merge sem sobrescrever: primeira ocorrência de cada chave vence.
 * Isso preserva o valor mais recente quando o mesmo exame aparece
 * em múltiplos blocos na mesma data (ex: hemograma duplicado).
 */
function mergeFields(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (target[key] === undefined && value !== null) {
      target[key] = value;
    }
  }
}

/* ─── Determinação do tipo de gasometria ─────────────────────── */

/**
 * Extrai o tipo de gasometria (V/A/C) do alias do bloco.
 * "_GASO_V" → "V",  "_GASO_A" → "A",  "_GASO_C" → "C"
 */
function gasoTypeFromAlias(alias) {
  const match = alias.match(/_GASO_([VAC])$/);
  return match ? match[1] : "V";  // fallback: venosa
}

function gasoOutputKey(type) {
  return GASO_PREFIX[type] || "GasoV";
}

/* ─── Pipeline principal ─────────────────────────────────────── */

/**
 * Processa texto bruto de laudo e retorna resultado estruturado.
 *
 * @param {string} raw - Texto copiado do laudo (pode conter múltiplos exames e datas)
 * @returns {{ output: string, recognizedCount: number, ignoredCount: number, dateCount: number }}
 */
function processLabText(raw) {
  // Etapas 1 e 2: limpeza
  const sanitized = sanitizeRawText(raw);
  const clean     = removeNoise(sanitized);

  // Etapa 3: segmentação
  const blocks = splitIntoBlocks(clean);

  const byDate = {};
  let recognizedCount = 0;
  let ignoredCount    = 0;

  for (const block of blocks) {
    const date = extractCollectionDate(block);

    // Bloco sem data reconhecível → ignorar silenciosamente (ex: TFGE)
    if (!date) { ignoredCount++; continue; }

    const headerLine = block.split("\n")[0].trim();
    const blockAlias = resolveBlockAlias(headerLine);

    if (!blockAlias) { ignoredCount++; continue; }

    ensureDateEntry(byDate, date);
    const dateEntry = byDate[date];

    // ── Hemograma
    if (blockAlias === "_HEMOGRAMA") {
      const data = parseHemograma(block);
      if (Object.keys(data).length > 0) {
        mergeFields(dateEntry, data);
        recognizedCount++;
      } else {
        ignoredCount++;
      }
      continue;
    }

    // ── Painéis compostos (bilirrubinas, proteínas, ferro)
    if (["_BILIRRUBINAS", "_PROTEINAS", "_ELETROFORESE", "_FERRO_PANEL"].includes(blockAlias)) {
      const data = parsePanelBlock(block);
      if (Object.keys(data).length > 0) {
        mergeFields(dateEntry, data);
        recognizedCount++;
      } else {
        ignoredCount++;
      }
      continue;
    }

    // ── Coagulograma TP
    if (blockAlias === "_TP") {
      const data = parseCoagTP(block);
      const hasData = data.TP_seg || data.TP_ativ || data.RNI;
      if (hasData) {
        if (data.TP_seg  && dateEntry["TP_seg"]  === undefined) dateEntry["TP_seg"]  = data.TP_seg;
        if (data.TP_ativ && dateEntry["TP_ativ"] === undefined) dateEntry["TP_ativ"] = data.TP_ativ;
        if (data.RNI     && dateEntry["RNI"]     === undefined) dateEntry["RNI"]     = data.RNI;
        recognizedCount++;
      } else {
        ignoredCount++;
      }
      continue;
    }

    // ── Coagulograma TTPA
    if (blockAlias === "_TTPA") {
      const data = parseCoagTTPA(block);
      const hasData = data.TTPA_seg || data.TTPA_razao;
      if (hasData) {
        if (data.TTPA_seg   && dateEntry["TTPA_seg"]   === undefined) dateEntry["TTPA_seg"]   = data.TTPA_seg;
        if (data.TTPA_razao && dateEntry["TTPA_razao"] === undefined) dateEntry["TTPA_razao"] = data.TTPA_razao;
        recognizedCount++;
      } else {
        ignoredCount++;
      }
      continue;
    }

    // ── Gasometria
    if (blockAlias.startsWith("_GASO_")) {
      const data       = parseGasometria(block);
      const type       = gasoTypeFromAlias(blockAlias);  // "V" | "A" | "C"
      const outputKey  = gasoOutputKey(type);             // "GasoV" | "GasoA" | "GasoC"

      const hasData = GASO_ORDER.some(param => data[param] !== undefined);
      if (hasData) {
        // Cada tipo de gasometria fica no seu próprio sub-objeto
        if (!dateEntry._gasos[outputKey]) {
          dateEntry._gasos[outputKey] = data;
        }
        recognizedCount++;
      } else {
        ignoredCount++;
      }
      continue;
    }

    // ── Sorologias qualitativas
    if (blockAlias.startsWith("_QUAL_")) {
      const result = parseQualitativo(block);
      if (result) {
        if (dateEntry._quals[blockAlias] === undefined) {
          dateEntry._quals[blockAlias] = result;
        }
        recognizedCount++;
      } else {
        ignoredCount++;
      }
      continue;
    }

    // ── Microbiológicos
    if (blockAlias.startsWith("_MICRO_")) {
      const { resultado, microorg } = parseMicrobiologico(block);
      if (resultado) {
        const material = extractMaterial(headerLine);
        dateEntry._micros.push({ key: blockAlias, material, resultado, microorg });
        recognizedCount++;
      } else {
        ignoredCount++;
      }
      continue;
    }

    // ── Exame simples genérico
    const data = parseSimples(block, blockAlias);
    if (Object.keys(data).length > 0) {
      mergeFields(dateEntry, data);
      recognizedCount++;
    } else {
      ignoredCount++;
    }
  }

  const output    = formatLabsOutput(byDate);
  const dateCount = Object.keys(byDate).length;

  return { output, recognizedCount, ignoredCount, dateCount };
}
