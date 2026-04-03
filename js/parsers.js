/**
 * parsers.js — Parsers especializados por tipo de bloco
 *
 * Responsabilidade: extrair valores numéricos ou qualitativos de cada
 * tipo de bloco de exame e retorná-los como objeto chave→valor.
 *
 * Cada parser recebe um bloco (string) e retorna um objeto plano.
 * Nenhum parser sabe sobre datas, agrupamento ou formatação de saída.
 *
 * Parsers disponíveis:
 *   parseHemograma(block)       → Hb, Ht, VCM, HCM, CHCM, RDW, LEUCO, diferenciais, PLQ
 *   parseBilirrubinas(block)    → BilT, BilD, BilI
 *   parseProteinas(block)       → ProtT, Alb, Glob
 *   parseFerroPainel(block)     → CTLF, SatTransf
 *   parseCoagTP(block)          → TP_seg, TP_ativ, RNI
 *   parseCoagTTPA(block)        → TTPA_seg, TTPA_razao
 *   parseGasometria(block)      → Gaso_pH, Gaso_pCO2, Gaso_pO2, Gaso_HCO3, Gaso_BE, Gaso_sO2
 *   parseQualitativo(block)     → string "NR" | "NEG" | "POS" | "INCONCL" | "R"
 *   parseMicrobiologico(block)  → { resultado, microorg }
 *   parseSimples(block, key)    → { [key]: valor }
 */

"use strict";

/* ══════════════════════════════════════════════════════════════
   HEMOGRAMA
   Suporta dois formatos:
   A) Ambulatório: "Neutrófilos 63,80 % 3,87 mil/mm³ 1,7 a 8"
   B) Biofast:     "Neutrófilos 82,8 % 12188 /mm³ 4752 ..."
                   "Plaquetas   186.000 /mm³"
══════════════════════════════════════════════════════════════ */

function parseHemograma(block) {
  const result = {};
  const lines  = block.split("\n");
  let pastResultados = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Parar ao atingir histórico
    if (/^\s*resultados?\s+anteriores\s*:/im.test(line)) { pastResultados = true; }
    if (pastResultados) continue;

    // Pular seções internas e cabeçalhos de tabela
    if (/^(eritrograma|leucograma|plaquetas\s+valores|plaquetas\s*$|observa[çc][oõ]es|resultados?\s+valores|metodologia|automatizada|hemograma|coletado|liberado|metodo|hemac)/i.test(line)) continue;

    // Plaquetas Biofast: "Resultados: 186.000 /mm³"
    // Plaquetas Ambulatório: "Resultados: 213 mil/mm³"
    if (/^resultados?\s*:/i.test(line)) {
      const raw = line.replace(/^resultados?\s*:/i, "").trim();
      // Remove separadores de milhar (ponto antes de 3 dígitos)
      // ex: "186.000 /mm³" → "186000" → depois converter para "186"
      const cleaned = raw.replace(/\.(\d{3})(?=\s|$|\/)/g, "$1");
      const num = extractFirstNumber(cleaned);
      if (num) {
        // Se PLQ veio em /mm³ (valor > 10000), converter para mil/mm³
        const plqFloat = parseFloat(num.replace(",", "."));
        const plqNorm = plqFloat > 10000
          ? (plqFloat / 1000).toFixed(0)
          : num;
        if (!result["PLQ"]) result["PLQ"] = plqNorm;
      }
      continue;
    }

    // Tokenizar: [Nome...] [número] [número?] [...]
    const tokens = line.split(/\s+/);
    let nameEndIdx = tokens.length;
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      // Número isolado (inteiro ou decimal com vírgula/ponto)
      if (/^-?\d+([,.]\d+)?$/.test(t)) { nameEndIdx = i; break; }
    }
    if (nameEndIdx === 0 || nameEndIdx >= tokens.length) continue;

    const namePart = tokens.slice(0, nameEndIdx).join(" ");
    const key      = resolveHemoAlias(namePart);
    if (!key) continue;

    // Coletar todos os números puros da parte de valor
    // (ignora tokens com letras, separadores de milhar no meio, etc.)
    const valueTokens = tokens.slice(nameEndIdx);
    const nums = valueTokens
      .map(t => {
        // Remove separador de milhar antes de checar
        const cleaned = t.replace(/\.(\d{3})/g, "$1");
        return /^-?\d+([,.]\d+)?$/.test(cleaned) ? cleaned.replace(".", ",") : null;
      })
      .filter(Boolean);

    if (nums.length === 0) continue;

    if (key === "PLQ") {
      if (!result["PLQ"]) result["PLQ"] = nums[0];
      continue;
    }
    if (key === "LEUCO") {
      if (!result["LEUCO"]) {
        // Biofast: "LEUCÓCITOS 100 % 14720 /mm³" → nums[0]=100(%), nums[1]=14720(/mm³)
        // Ambulatório: "LEUCÓCITOS 6,06 mil/mm³" → nums[0]=6,06
        // Heurística: se primeiro número é 100 (percentual total) e há segundo número → usar segundo
        const firstVal = parseFloat(nums[0].replace(",", "."));
        if (firstVal === 100 && nums.length >= 2) {
          const absRaw = parseFloat(nums[1].replace(",", "."));
          // Converter /mm³ para mil/mm³ se valor > 500
          result["LEUCO"] = absRaw > 500
            ? (absRaw / 1000).toFixed(2).replace(".", ",")
            : nums[1];
        } else {
          result["LEUCO"] = nums[0];
        }
      }
      continue;
    }

    // Diferenciais: formato ambulatório = [%, absoluto_mil]
    //               formato Biofast     = [%, absoluto_mm3, anterior, ...]
    // Em ambos, nums[0]=%, nums[1]=absoluto → preferir absoluto
    if (LEUCO_ORDER.includes(key)) {
      // Formato ambulatório: "Neutrófilos 63,80 % 3,87 mil/mm³"
      //   nums[0]=63,80(%), nums[1]=3,87 → já em mil/mm³, usar direto
      // Formato Biofast:    "Neutrófilos 82,8 % 12188 /mm³ 4752"
      //   nums[0]=82,8(%), nums[1]=12188 → em /mm³ bruto, dividir por 1000
      //                    "Eosinófilos 0,2 % 29 /mm³ 71"
      //   nums[0]=0,2(%), nums[1]=29 → em /mm³ bruto, dividir por 1000
      //
      // Critério Biofast: valor absoluto é inteiro (sem vírgula) E linha contém "/mm"
      // Critério ambulatório: valor absoluto tem vírgula decimal ("3,87", "0,07")
      if (nums.length >= 2) {
        const absStr = nums[1];
        const absRaw = parseFloat(absStr.replace(",", "."));
        const isBiofastUnit = !absStr.includes(",") && line.includes("/mm");
        const absNorm = isBiofastUnit
          ? (absRaw / 1000).toFixed(2).replace(".", ",")
          : absStr;
        result[key] = absNorm;
      } else {
        // Só percentual → guardar para calcular depois via fallback
        if (!result[`${key}_pct`]) result[`${key}_pct`] = nums[0];
      }
      continue;
    }

    // Hb, Ht, VCM, HCM, CHCM, RDW — primeiro número
    if (!result[key]) result[key] = nums[0];
  }

  // Fallback: calcular absolutos a partir de percentuais quando necessário
  if (result["LEUCO"]) {
    const leucoFloat = parseFloat(result["LEUCO"].replace(",", "."));
    for (const subKey of LEUCO_ORDER) {
      if (!result[subKey] && result[`${subKey}_pct`]) {
        const pct = parseFloat(result[`${subKey}_pct`].replace(",", "."));
        result[subKey] = (leucoFloat * pct / 100).toFixed(2).replace(".", ",");
      }
    }
  }

  // Limpar chaves temporárias de percentual
  for (const subKey of LEUCO_ORDER) delete result[`${subKey}_pct`];

  return result;
}

/* ══════════════════════════════════════════════════════════════
   PAINÉIS COMPOSTOS SIMPLES
   (bilirrubinas, proteínas, ferro)
   Todos seguem o mesmo padrão: linha com "Nome Valor Unidade..."
══════════════════════════════════════════════════════════════ */

function parsePanelBlock(block) {
  const result = {};
  const lines  = block.split("\n");
  let pastResultados = false;

  for (const line of lines) {
    const l = line.trim();
    if (!l) continue;
    if (/^\s*resultados?\s+anteriores\s*:/im.test(l)) { pastResultados = true; }
    if (pastResultados) continue;
    if (/^(coletado|liberado|resultado|valores|metodo)/i.test(l)) continue;

    // "Capacidade latente..." → sempre ignorar
    if (/capacidade\s+latente/i.test(l)) continue;

    const tokens = l.split(/\s+/);
    let nameEndIdx = tokens.length;
    for (let i = 0; i < tokens.length; i++) {
      if (/^\d+([,.]\d+)?$/.test(tokens[i])) { nameEndIdx = i; break; }
    }
    if (nameEndIdx === 0 || nameEndIdx >= tokens.length) continue;

    const namePart = tokens.slice(0, nameEndIdx).join(" ");
    const panelKey = resolvePanelAlias(namePart);
    if (!panelKey) continue;  // null = ignorar (capacidade latente)

    const num = extractFirstNumber(tokens.slice(nameEndIdx).join(" "));
    if (num && result[panelKey] === undefined) result[panelKey] = num;
  }

  return result;
}

// Aliases específicos para manter interface clara nos callers
const parseBilirrubinas = parsePanelBlock;
const parseProteinas    = parsePanelBlock;
const parseFerroPainel  = parsePanelBlock;

/* ══════════════════════════════════════════════════════════════
   COAGULOGRAMA — TP
   Suporta dois formatos:
   A) Ambulatório: "Tempo de protrombina 13,6 seg" + "Atividade 89,0 %" + "RNI 1,090"
   B) Biofast:     "Atividade protrombinica 50,7 %" + "INR 1,39"
                   (sem linha de segundos)
══════════════════════════════════════════════════════════════ */

function parseCoagTP(block) {
  const result = parsePanelBlock(block);
  return {
    TP_seg:  result["TP_seg"]  ?? null,
    TP_ativ: result["TP_ativ"] ?? null,
    RNI:     result["RNI"]     ?? null,
  };
}

/* ══════════════════════════════════════════════════════════════
   COAGULOGRAMA — TTPA
══════════════════════════════════════════════════════════════ */

function parseCoagTTPA(block) {
  const result = parsePanelBlock(block);
  return {
    TTPA_seg:   result["TTPA_seg"]   ?? null,
    TTPA_razao: result["TTPA_razao"] ?? null,
  };
}

/* ══════════════════════════════════════════════════════════════
   GASOMETRIA
   Formato Biofast:
     pH 7,215   7,372 (15/03/2026)   7,320 a 7,430
     pCO2 45,4 mmHg   50,4 (...)     41,00 a 51,00 mmHg
     HCO3 18 mmol/L   28,6 (...)     22,00 a 29,00 mmol/L
     BE -9.8 mmol/L   2.4 (...)      0 a +/- 4mmol/L
     sO2 46,7 %        29,6 (...)     40,00 a 70,00%

   Atenção: BE pode ser negativo ("-9.8") — extractFirstNumber suporta.
   Atenção: resultado anterior aparece antes dos valores de referência
            na mesma linha → precisamos pegar APENAS o primeiro número.
══════════════════════════════════════════════════════════════ */

function parseGasometria(block) {
  const result = {};
  const lines  = block.split("\n");
  let pastResultados = false;

  for (const line of lines) {
    const l = line.trim();
    if (!l) continue;
    if (/^\s*resultados?\s+anteriores\s*:/im.test(l)) { pastResultados = true; }
    if (pastResultados) continue;
    if (/^(coletado|liberado|resultado|valores|metodo|potenc|ampero|henderson|nota|gasometria)/i.test(l)) continue;

    const tokens = l.split(/\s+/);
    let nameEndIdx = tokens.length;
    for (let i = 0; i < tokens.length; i++) {
      // Aceitar também número negativo como início dos valores
      if (/^-?\d+([,.]\d+)?$/.test(tokens[i])) { nameEndIdx = i; break; }
    }
    if (nameEndIdx === 0 || nameEndIdx >= tokens.length) continue;

    const namePart  = tokens.slice(0, nameEndIdx).join(" ");
    const panelKey  = resolvePanelAlias(namePart);
    if (!panelKey || !panelKey.startsWith("Gaso_")) continue;

    // Pegar APENAS o primeiro número (ignora resultados anteriores na mesma linha)
    const num = extractFirstNumber(tokens.slice(nameEndIdx).join(" "));
    if (num && result[panelKey] === undefined) result[panelKey] = num;
  }

  return result;
}

/* ══════════════════════════════════════════════════════════════
   QUALITATIVO (sorologias)
   Varre as linhas buscando padrão qualitativo.
   Para antes de "Resultados anteriores:".
══════════════════════════════════════════════════════════════ */

function parseQualitativo(block) {
  const lines = block.split("\n");
  let pastResultados = false;

  for (let i = 1; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l) continue;
    if (/^\s*resultados?\s+anteriores\s*:/im.test(l)) { pastResultados = true; }
    if (pastResultados) continue;

    // Ignorar linhas de metadados / valores de referência / métodos
    if (/^(coletado|liberado|resultado\s+valor|resultado\s*$|valores\s+de|metodo|metodologia|indice|cmia|quimio|imuno|elisa|eletro|turbidim)/i.test(l)) continue;
    // Ignorar linhas de referência numérica (ex: "< 0,80 S/CO Não reagente")
    if (/^[<>]\s*[\d,]/.test(l)) continue;

    if (/n[ãa]o\s*reagente|n[ãa]o\s*houve|negati|positiv|inconclusiv/i.test(l)) {
      return normalizeQual(l);
    }
    if (/^reagente$/i.test(l)) return "R";
  }
  return null;
}

/* ══════════════════════════════════════════════════════════════
   MICROBIOLÓGICO
   Extrai resultado textual e microorganismo (quando positivo).
══════════════════════════════════════════════════════════════ */

function parseMicrobiologico(block) {
  const lines    = block.split("\n");
  let resultado  = null;
  let microorg   = null;

  for (const line of lines) {
    const l = line.trim();
    if (!l) continue;

    // "Resultado: Negativo" ou "Resultado:Positivo"
    const resMatch = l.match(/^resultado\s*:\s*(.+)/i);
    if (resMatch) { resultado = resMatch[1].trim(); continue; }

    // "Microorganismo: Fungo filamentoso hialino..."
    const microMatch = l.match(/^microorganismo\s*:\s*(.+)/i);
    if (microMatch) { microorg = microMatch[1].trim(); continue; }

    // BAAR / bacterioscopia: resultado na linha de valor sem prefixo
    if (/^(negativ|positiv|n[ãa]o\s*houve)/i.test(l) && !resultado) {
      resultado = l;
    }
  }

  return { resultado, microorg };
}

/* ══════════════════════════════════════════════════════════════
   EXAME SIMPLES GENÉRICO
   Para todos os exames com um único valor principal.

   Desafio do Biofast:
   A linha do resultado pode ter resultado anterior na mesma linha:
     "46.74 mg/dL  7.68 (15/03/2026)  Inferior a 0,5 mg/dL*"
   → pegar APENAS o primeiro número, antes do resultado anterior.

   Estratégia: parar na primeira linha que começa com número
   (com ou sem espaço líder) e extrair somente o primeiro token numérico.
══════════════════════════════════════════════════════════════ */

function parseSimples(block, blockKey) {
  if (!blockKey) return {};

  const lines = block.split("\n");
  let pastResultados = false;
  let found = false;

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const l       = rawLine.trim();

    if (!l) continue;
    if (/^\s*resultados?\s+anteriores\s*:/im.test(l)) { pastResultados = true; }
    if (pastResultados) continue;

    // Pular cabeçalhos de tabela e metadados
    if (/^(coletado|liberado|resultado\s+valor|resultado\s*$|valores\s+de\s+refer|metodo|metodologia)/i.test(l)) continue;

    // Linha que começa com número (espaço líder tolerado)
    if (/^\s*-?\d/.test(rawLine) && !found) {
      const num = extractFirstNumber(l);
      if (num) return { [blockKey]: num };
    }
  }

  return {};
}
