/**
 * normalizer.js — Limpeza e segmentação do texto bruto dos laudos
 *
 * Responsabilidade: transformar texto copiado (cheio de ruído) em
 * blocos limpos prontos para os parsers especializados.
 *
 * Três etapas em sequência:
 *   1. sanitizeRawText    — normaliza quebras de linha e espaços
 *   2. removeNoise        — remove cabeçalho institucional repetido
 *   3. splitIntoBlocks    — divide em blocos por exame
 */

"use strict";

/* ══════════════════════════════════════════════════════════════
   ETAPA 1 — Sanitização
══════════════════════════════════════════════════════════════ */

/**
 * Normaliza quebras de linha e colapsa espaços excedentes.
 * Não remove conteúdo — apenas uniformiza o formato.
 */
function sanitizeRawText(raw) {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map(line => line.replace(/[ \t]+/g, " "))  // colapsa espaços dentro da linha
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");                // colapsa 3+ quebras em 2
}

/* ══════════════════════════════════════════════════════════════
   ETAPA 2 — Remoção de ruído institucional
══════════════════════════════════════════════════════════════ */

/**
 * Padrões de linhas que são sempre ruído.
 *
 * Por que regex e não startsWith:
 * Algumas linhas têm prefixo variável (ex: "Pedido: 123 - Emissão: ...")
 * e o regex captura melhor esse padrão sem precisar de múltiplas condições.
 */
const NOISE_LINE_PATTERNS = [
  // Cabeçalho institucional — ambulatório
  /^HOSPITAL DO SERVIDOR/i,
  /^FMO\s*$/i,
  /^SERVIÇO DE LABORATÓRIO/i,
  /^CLÍNICAS\s*$/i,
  // Cabeçalho institucional — Biofast (pronto-socorro)
  /^LABORATÓRIO BIOFAST/i,
  // Metadados comuns a ambos
  /^Diretor Técnico:/i,
  /^Responsável Técnico:/i,
  /^Nº CEVS:/i,
  /^Av\.\s/i,
  /^Emissão:/i,
  /^Pedido:\s*$/i,
  /^Pedido:\s*\d/i,
  /^Prontuário:/i,
  /^Data Nasc\./i,
  /^Solicitante:/i,
  /^Setor solicitante:/i,
  /^Responsável:/i,
  /^Atendimento:/i,
  // Disclaimers — dois formatos distintos
  /^Os resultados dos exames/i,
  /^Os resultados devem ser interpretados/i,
  /^A interpretação correta/i,
  /^análise conjunta/i,
  /^e deve ser feita/i,
  // Notas institucionais genéricas
  /^NOVOS VALORES DE REFERÊNCIA/i,
  /^PARA LAUDOS/i,
  /^EXAMES REALIZADOS EM CONFORMIDADE/i,
  // Separadores visuais
  /^_{5,}/,
  /^-{5,}/,
];

/**
 * Padrão de conselho profissional em linha solta.
 * Cobre CRF, CRM, CRBIO, CRBM, CRA e variantes com traço ou dois-pontos.
 */
const COUNCIL_LINE_PATTERN = /^(CRF|CRM|CRBIO|CRBM|CRA)\s*[-:]?\s*[\d\/]/i;

/**
 * Linha de nome profissional seguida de conselho.
 * Detecta o par (NOME EM CAPS / CONSELHO) e pula as duas linhas.
 *
 * Por que checar a próxima linha junto:
 * O nome isolado pode ser confundido com um nome de exame se não
 * confirmarmos que a linha seguinte é um conselho profissional.
 */
function isProfessionalNameLine(line, nextLine) {
  if (!nextLine) return false;
  const isAllCaps = /^[A-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ\s\.\-]+$/.test(line);
  const isReasonableLength = line.length > 4 && line.length < 70;
  const nextIsCouncil = COUNCIL_LINE_PATTERN.test(nextLine.trim());
  return isAllCaps && isReasonableLength && nextIsCouncil;
}

function removeNoise(text) {
  const lines = text.split("\n");
  const cleaned = [];
  let i = 0;

  while (i < lines.length) {
    const current = lines[i].trim();
    const next    = i + 1 < lines.length ? lines[i + 1].trim() : null;

    // Pular par: nome profissional + conselho
    if (isProfessionalNameLine(current, next)) {
      i += 2;
      continue;
    }

    // Pular linha de conselho solta (sem nome antes — ex: "CRF 77862" isolado)
    if (COUNCIL_LINE_PATTERN.test(current)) {
      i++;
      continue;
    }

    // Pular linhas de ruído institucional
    if (NOISE_LINE_PATTERNS.some(pattern => pattern.test(current))) {
      i++;
      continue;
    }

    cleaned.push(lines[i]);
    i++;
  }

  return cleaned.join("\n");
}

/* ══════════════════════════════════════════════════════════════
   ETAPA 3 — Segmentação em blocos de exame
══════════════════════════════════════════════════════════════ */

/**
 * Determina se uma linha é o cabeçalho de início de um exame.
 *
 * Critérios (todos devem ser satisfeitos):
 * 1. Contém vírgula separando nome do material biológico
 * 2. O ÚLTIMO segmento é um material biológico reconhecível
 * 3. O nome (antes do material) não contém número decimal (vírgula/ponto entre dígitos)
 *    — exceto quando é nomenclatura química iniciada por número (ex: "25 OH VITAMINA D")
 * 4. ≥65% das letras do nome são maiúsculas
 *
 * Por que testar o ÚLTIMO segmento em vez do segundo:
 * Exames como "HCV, PESQUISA DE ANTICORPOS, SANGUE" têm múltiplas vírgulas.
 * O material biológico é sempre o último segmento.
 */
function isExamHeader(line) {
  const trimmed = line.trim();
  if (!trimmed.includes(",")) return false;

  const segments = trimmed.split(",").map(s => s.trim());
  const lastSegment = segments[segments.length - 1];
  const namePart    = segments.slice(0, -1).join(" ");  // tudo antes do último segmento

  // Critério 2: último segmento deve ser material biológico
  if (!MATERIAL_REGEX.test(lastSegment)) return false;

  // Critério 1: nome não pode estar vazio
  if (namePart.length < 3) return false;

  // Critério 3: rejeitar número decimal no nome (fora de parênteses)
  // "94,6 fL 80,0 a 100,0" → vírgula decimal → não é nome de exame
  const nameWithoutParens = namePart.replace(/\(.*?\)/g, "").trim();
  if (/\d[,.]\d/.test(nameWithoutParens)) return false;

  // Critério 3 (exceção): nome que começa com número de nomenclatura
  // "25 OH VITAMINA D" é válido; "94,6" não é
  if (/^\d/.test(nameWithoutParens) && !/^\d+\s+[A-Za-z]/.test(nameWithoutParens)) return false;

  // Critério 4: maioria das letras em maiúsculo
  const letters = namePart.replace(/[^a-zA-ZÀ-ÿ]/g, "");
  if (letters.length < 2) return false;
  const upperCount = letters.replace(/[^A-ZÀÁÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ]/g, "").length;
  return (upperCount / letters.length) >= 0.65;
}

/**
 * Junta linhas de nomes de exames quebradas em múltiplas linhas.
 *
 * Por que isso existe:
 * Culturas e alguns exames do Biofast têm o nome quebrado:
 *   "CULTURA DE MICOBACTERIA\nRESPIRATORIO INFERIOR, LAVADO\nBRONCOALVEOLAR"
 * Precisamos reconstruir a linha completa antes de segmentar.
 */
function joinBrokenExamNames(lines) {
  const result = [];
  let i = 0;

  while (i < lines.length) {
    const cur  = lines[i].trim();
    const next = i + 1 < lines.length ? lines[i + 1].trim() : null;

    // Linha em caps sem vírgula + próxima linha também em caps (ou tem vírgula de material)
    const isCapsLine = cur.length > 3 && /^[A-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ\s\(\)\/\-]+$/.test(cur);
    const nextIsContinuation = next &&
      /^[A-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ\s\(\)\/\-,]+$/.test(next) &&
      !isExamHeader(next);

    if (isCapsLine && !cur.includes(",") && nextIsContinuation) {
      // Acumular linhas até encontrar vírgula de material ou linha não-caps
      let joined = cur;
      let j = i + 1;
      while (j < lines.length) {
        const candidate = lines[j].trim();
        const isCaps = /^[A-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ\s\(\)\/\-,]+$/.test(candidate);
        if (!isCaps) break;
        joined += " " + candidate;
        j++;
        if (MATERIAL_REGEX.test(candidate)) break;  // chegou no material — parar
      }
      result.push(joined);
      i = j;
    } else {
      result.push(lines[i]);
      i++;
    }
  }

  return result;
}

/**
 * Divide o texto limpo em blocos, um por exame.
 * Cada bloco começa com a linha de cabeçalho e vai até o próximo cabeçalho.
 */
function splitIntoBlocks(cleanText) {
  const rawLines    = cleanText.split("\n");
  const joinedLines = joinBrokenExamNames(rawLines);

  const blocks = [];
  let   current = [];

  for (const line of joinedLines) {
    if (isExamHeader(line)) {
      if (current.length > 0) blocks.push(current.join("\n"));
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) blocks.push(current.join("\n"));

  // Descartar blocos muito curtos (ruído residual)
  return blocks.filter(block => block.trim().length > 10);
}

/* ══════════════════════════════════════════════════════════════
   UTILITÁRIOS COMPARTILHADOS
   (usados por normalizer e pelos parsers)
══════════════════════════════════════════════════════════════ */

/**
 * Normaliza string para busca nos dicionários:
 * minúsculo + sem acento + espaço simples
 */
function normalizeKey(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // remove diacríticos
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extrai data de coleta do bloco.
 * Suporta "Coletado em:" (ambulatório) e "Coletado:" (microbiológicos/Biofast).
 */
function extractCollectionDate(block) {
  const match = block.match(/coletad[oa]\s*(?:em\s*)?:\s*(\d{2}\/\d{2}\/\d{4})/i);
  return match ? match[1] : null;
}

/**
 * Extrai o primeiro número válido de uma string.
 * Suporta formato brasileiro (vírgula decimal) e americano (ponto decimal).
 * Rejeita tokens que são claramente intervalos (ex: "1,7 a 8", "80-100").
 *
 * Por que verificar os dois formatos:
 * O Biofast usa ponto decimal ("46.74", "7.68") enquanto
 * o sistema ambulatorial usa vírgula ("7,1", "14,9").
 */
function extractFirstNumber(str) {
  const tokens = str.trim().split(/\s+/);
  for (const token of tokens) {
    // Aceita: "14,2" | "14.2" | "186" | "-9,8" | "-9.8"
    if (/^-?\d+([,.]\d+)?$/.test(token)) {
      // Normaliza para vírgula (padrão interno)
      return token.replace(".", ",");
    }
  }
  return null;
}

/**
 * Resolve alias de bloco a partir do header completo da linha de exame.
 *
 * Por que receber o header completo e não só o nome:
 * "HCV, PESQUISA DE ANTICORPOS, SANGUE" — só com split(",")[0]
 * teríamos "HCV" que é muito curto para o alias "hcv pesquisa de anticorpos".
 * Passando o header completo, reconstruímos o nome sem o material final.
 */
function resolveBlockAlias(headerLine) {
  const segments  = headerLine.split(",").map(s => s.trim());
  const namePart  = segments.slice(0, -1).join(" ");  // sem o material
  const nameClean = normalizeKey(namePart.replace(/\s*\(.*?\)\s*/g, " ").trim());

  // Busca exata primeiro
  if (ALIASES_BLOCK[nameClean]) return ALIASES_BLOCK[nameClean];

  // Busca por prefixo mais longo (para aliases parciais)
  let bestMatch = null;
  let bestLength = 0;
  for (const [key, value] of Object.entries(ALIASES_BLOCK)) {
    if (nameClean.startsWith(key) && key.length > bestLength) {
      bestMatch  = value;
      bestLength = key.length;
    }
  }
  return bestMatch;
}

/**
 * Resolve alias dentro de um painel composto (ex: linha "RNI 1,24" no bloco do TP).
 */
function resolvePanelAlias(name) {
  const key = normalizeKey(name);
  if (ALIASES_PANEL[key] !== undefined) return ALIASES_PANEL[key];

  let bestMatch  = undefined;
  let bestLength = 0;
  for (const [aliasKey, value] of Object.entries(ALIASES_PANEL)) {
    if (key.startsWith(aliasKey) && aliasKey.length > bestLength) {
      bestMatch  = value;
      bestLength = aliasKey.length;
    }
  }
  return bestMatch;
}

/**
 * Resolve alias interno do hemograma (ex: "Neutrófilos" → "neut").
 */
function resolveHemoAlias(name) {
  const key = normalizeKey(name);
  if (ALIASES_HEMO[key]) return ALIASES_HEMO[key];

  let bestMatch  = null;
  let bestLength = 0;
  for (const [aliasKey, value] of Object.entries(ALIASES_HEMO)) {
    if (key.startsWith(aliasKey) && aliasKey.length > bestLength) {
      bestMatch  = value;
      bestLength = aliasKey.length;
    }
  }
  return bestMatch;
}

/**
 * Extrai o material de coleta do header para uso nos microbiológicos.
 * Ex: "CULTURA AEROBIA ..., LAVADO BRONCOALVEOLAR" → "LBA"
 */
function extractMaterial(headerLine) {
  const segments   = headerLine.split(",");
  const lastSegment = segments[segments.length - 1].trim();
  return abbreviateMaterial(lastSegment);
}

/**
 * Converte data "dd/mm/aaaa" para "aaaa-mm-dd" para ordenação lexicográfica.
 */
function dateToSortKey(dmy) {
  if (!dmy) return "";
  const [d, m, y] = dmy.split("/");
  return `${y}-${m}-${d}`;
}
