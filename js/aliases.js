/**
 * aliases.js — Dicionários centrais do parser IAMSPE Labs v3
 *
 * Responsabilidade: mapear nomes de exames (conforme aparecem nos laudos)
 * para chaves internas padronizadas usadas em todo o sistema.
 *
 * Por que chaves com prefixo _:
 *   _HEMOGRAMA, _BILIRRUBINAS, etc. → blocos compostos que precisam de
 *   parser especializado, não do parser simples genérico.
 *   _QUAL_* → resultado qualitativo (Reagente / Não Reagente / Negativo)
 *   _MICRO_* → microbiológico (resultado textual)
 *   _GASO_*  → gasometria (painel com múltiplos parâmetros)
 */

"use strict";

/* ─── Aliases internos do hemograma (linha por linha do bloco) ── */
const ALIASES_HEMO = {
  // Eritrograma
  "hemoglobina":   "Hb",
  "hematocrito":   "Ht",
  "hemacias":      "Ht",   // "Hemácias" no Biofast representa o mesmo bloco de entrada
  "vcm":           "VCM",
  "hcm":           "HCM",
  "chcm":          "CHCM",
  "rdw-cv":        "RDW",
  "rdw":           "RDW",
  // Leucograma — "Segmentados" e "Neutrófilos" são o mesmo no Biofast
  "leucocitos":    "LEUCO",
  "leucocito":     "LEUCO",
  "neutrofilos":   "neut",
  "neutrofilo":    "neut",
  "segmentados":   "neut",   // Biofast usa "Segmentados" em vez de "Neutrófilos"
  "segmentado":    "neut",
  "eosinofilos":   "eos",
  "eosinofilo":    "eos",
  "basofilos":     "baso",
  "basofilo":      "baso",
  "linfocitos":    "linf",
  "linfocito":     "linf",
  "monocitos":     "mono",
  "monocito":      "mono",
  // Plaquetas
  "plaquetas":     "PLQ",
  "plaqueta":      "PLQ",
};

/* ─── Aliases de bloco: header do exame → chave interna ───────── */
// Chave = nome normalizado (sem acento, minúsculo, espaço simples)
// Valor = chave interna (string simples ou prefixo _ para blocos especiais)
const ALIASES_BLOCK = {
  // Hemograma (bloco composto especializado)
  "hemograma":                                "_HEMOGRAMA",

  // Glicemia
  "glicose":                                  "GLIC",
  "glicemia":                                 "GLIC",
  "hemoglobina glicada":                      "HbA1c",

  // Função renal
  "ureia":                                    "U",
  "creatinina":                               "CR",

  // Eletrólitos
  "sodio":                                    "Na",
  "potassio":                                 "K",
  "magnesio":                                 "Mg",
  "fosforo":                                  "P",
  "calcio":                                   "Ca",
  "calcio ionizado":                          "CaI",

  // Básico / inflamação
  "acido urico":                              "AcUrico",
  "proteina c reativa":                       "PCR",
  "pcr":                                      "PCR",
  "hemossedimentacao":                        "VHS",
  "vhs":                                      "VHS",
  "albumina":                                 "Alb",
  "paratormonio":                             "PTH",
  "pth":                                      "PTH",
  "acido folico":                             "Folato",
  "folato":                                   "Folato",
  "lactato":                                  "Lactato",

  // Hepático
  "aspartato amino transferase":              "TGO",
  "aspartato aminotransferase":              "TGO",
  "alanino amino transferase":               "TGP",
  "alanino aminotransferase":               "TGP",
  "fosfatase alcalina":                      "FAL",
  "gama gt":                                 "GGT",
  "gama-gt":                                 "GGT",
  "amilase":                                 "Amilase",
  "lipase":                                  "Lipase",

  // Bilirrubinas (bloco composto)
  "bilirrubinas total e fracoes":            "_BILIRRUBINAS",
  "bilirrubinas total e frações":            "_BILIRRUBINAS",

  // Proteínas (bloco composto)
  "proteinas totais e fracoes":              "_PROTEINAS",
  "proteínas totais e frações":              "_PROTEINAS",
  "eletroforese de proteinas":               "_ELETROFORESE",

  // Lipídios
  "colesterol total":                        "CT",
  "colesterol hdl":                          "HDL",
  "colesterol ldl":                          "LDL",
  "colesterol vldl":                         "VLDL",
  "colesterol nao hdl":                      "NHDL",
  "triglicerides":                           "TG",
  "triglicerideos":                          "TG",

  // Ferro (bloco composto)
  "ferro":                                   "Fe",
  "capacidade total de ligacao de ferro":    "_FERRO_PANEL",
  "capacidade total ligacao de ferro":       "_FERRO_PANEL",

  // Coagulograma (blocos compostos)
  "tempo de protrombina":                    "_TP",
  "tempo de atividade de protrombina":       "_TP",   // Biofast usa este nome
  "tempo de tromboplastina parcial ativado": "_TTPA",

  // Tireoide
  "triiodotironina":                         "T3",
  "t3 total":                                "T3",
  "tiroxina livre":                          "T4L",
  "t4 livre":                                "T4L",
  "hormonio tireotrof":                      "TSH",
  "anticorpo anti tireoglobulina":           "AntiTg",

  // Vitaminas e reservas
  "25 oh vitamina d":                        "VitD",
  "25-oh vitamina d":                        "VitD",
  "vitamina d":                              "VitD",
  "vitamina b12":                            "B12",
  "cobalamina":                              "B12",
  "ferritina":                               "Ferritina",

  // Outros
  "cpk":                                     "CPK",
  "ck":                                      "CPK",

  // Imunologia / imunoglobulinas
  "imunoglobulina g":                        "IgG",
  "imunoglobulina a":                        "IgA",
  "imunoglobulina m":                        "IgM",
  "imunoglobulina e":                        "IgE",
  "fator reumatoide":                        "FR",

  // Gasometria (bloco composto — tipo determinado pelo material)
  "gasometria venosa":                       "_GASO_V",
  "gasometria arterial":                     "_GASO_A",
  "gasometria capilar":                      "_GASO_C",
  "gasometria":                              "_GASO_V",  // fallback

  // Sorologias qualitativas
  "hbsag":                                   "_QUAL_HBsAg",
  "anti hbc anticorpos totais":              "_QUAL_AntiHBc",
  "anti hbc":                                "_QUAL_AntiHBc",
  "hcv pesquisa de anticorpos":              "_QUAL_HCV",
  "hcv anticorpos":                          "_QUAL_HCV",
  "hiv anticorpos e antigeno p24":           "_QUAL_HIV",
  "hiv":                                     "_QUAL_HIV",
  "sifilis sorologia":                       "_QUAL_Sifilis",
  "sifilis":                                 "_QUAL_Sifilis",
  "fan crithidia":                           "_QUAL_FANcrith",
  "fan hep2":                                "_QUAL_FANhep2",
  "anti rnp":                                "_QUAL_AntiRNP",
  "anti sm":                                 "_QUAL_AntiSm",
  "anti ssa-ro":                             "_QUAL_AntiSSA",
  "anti ssa ro":                             "_QUAL_AntiSSA",
  "anti ssb-la":                             "_QUAL_AntiSSB",
  "anti ssb la":                             "_QUAL_AntiSSB",
  "anti jo1":                                "_QUAL_AntiJO1",
  "anti scl70":                              "_QUAL_AntiSCL70",
  "anti scl 70":                             "_QUAL_AntiSCL70",

  // Microbiológicos
  "cultura aerobia":                         "_MICRO_CultAerobia",
  "cultura de fungo":                        "_MICRO_CultFungo",
  "cultura de micobacteria":                 "_MICRO_CultMicob",
  "pesquisa de baar":                        "_MICRO_BAAR",
  "baar":                                    "_MICRO_BAAR",
  "bacterioscopia":                          "_MICRO_Bacterio",
};

/* ─── Aliases internos dos painéis compostos ──────────────────── */
const ALIASES_PANEL = {
  // Bilirrubinas
  "bilirrubina direta":    "BilD",
  "bilirrubinas totais":   "BilT",
  "bilirrubina total":     "BilT",
  "bilirrubina indireta":  "BilI",

  // Proteínas totais
  "proteinas totais":      "ProtT",
  "albumina":              "Alb",
  "globulinas":            "Glob",

  // Ferro
  "capacidade total de ligacao de ferro":  "CTLF",
  "capacidade latente":                    null,   // ignorar
  "indice de saturacao de transferrina":   "SatTransf",
  "saturacao de transferrina":             "SatTransf",

  // TP — ambulatório e Biofast têm nomes diferentes
  "tempo de protrombina":       "TP_seg",
  "atividade protorombinica":   "TP_ativ",   // Biofast
  "atividade protrombinica":    "TP_ativ",   // Biofast (variante)
  "atividade":                  "TP_ativ",
  "rni":                        "RNI",
  "inr":                        "RNI",       // Biofast usa "INR"

  // TTPA
  "ttpa":                       "TTPA_seg",
  "razao":                      "TTPA_razao",

  // Gasometria
  "ph":     "Gaso_pH",
  "pco2":   "Gaso_pCO2",
  "po2":    "Gaso_pO2",
  "hco3":   "Gaso_HCO3",
  "be":     "Gaso_BE",
  "so2":    "Gaso_sO2",
};

/* ─── Rótulos curtos para sorologias qualitativas ─────────────── */
const QUAL_LABELS = {
  "_QUAL_HBsAg":    "HBsAg",
  "_QUAL_AntiHBc":  "AntiHBc",
  "_QUAL_HCV":      "HCV",
  "_QUAL_HIV":      "HIV",
  "_QUAL_Sifilis":  "Sífilis",
  "_QUAL_FANcrith": "FANcrith",
  "_QUAL_FANhep2":  "FANhep2",
  "_QUAL_AntiRNP":  "Anti-RNP",
  "_QUAL_AntiSm":   "Anti-SM",
  "_QUAL_AntiSSA":  "Anti-SSA",
  "_QUAL_AntiSSB":  "Anti-SSB",
  "_QUAL_AntiJO1":  "Anti-JO1",
  "_QUAL_AntiSCL70":"Anti-SCL70",
};

/* ─── Rótulos curtos para microbiológicos ─────────────────────── */
const MICRO_LABELS = {
  "_MICRO_CultAerobia": "CultAerobia",
  "_MICRO_CultFungo":   "CultFungo",
  "_MICRO_CultMicob":   "CultMicob",
  "_MICRO_BAAR":        "BAAR",
  "_MICRO_Bacterio":    "Bacterio",
};

/* ─── Rótulos e ordem dos parâmetros da gasometria ───────────── */
const GASO_ORDER  = ["Gaso_pH", "Gaso_pCO2", "Gaso_pO2", "Gaso_HCO3", "Gaso_BE", "Gaso_sO2"];
const GASO_LABELS = {
  Gaso_pH:   "pH",
  Gaso_pCO2: "pCO2",
  Gaso_pO2:  "pO2",
  Gaso_HCO3: "HCO3",
  Gaso_BE:   "BE",
  Gaso_sO2:  "sO2",
};
// Prefixo de rótulo por tipo de coleta
const GASO_PREFIX = { V: "GasoV", A: "GasoA", C: "GasoC" };

/* ─── Ordem fixa de exibição na saída ────────────────────────── */
const OUTPUT_ORDER = [
  // Hemograma
  "Hb", "Ht", "VCM", "HCM", "CHCM", "RDW",
  "LEUCO",   // → inline com diferenciais
  "PLQ",

  // Glicemia
  "GLIC", "HbA1c",

  // Função renal + eletrólitos
  "U", "CR", "Na", "K", "Ca", "CaI", "Mg", "P",

  // Hepático
  "TGO", "TGP", "FAL", "GGT",
  "BilT", "BilD", "BilI",
  "Amilase", "Lipase",

  // Proteínas
  "Alb", "ProtT", "Glob",

  // Coagulograma
  "TP",    // → composto: seg (opcional) + ativ% + RNI
  "TTPA",  // → composto: seg + razão

  // Gasometria — ordem por tipo de coleta
  "GasoV", "GasoA", "GasoC",

  // Lipídios
  "CT", "HDL", "LDL", "VLDL", "NHDL", "TG",

  // Outros básicos
  "AcUrico", "PCR", "VHS", "FR", "Lactato",

  // Ferro e reservas
  "Fe", "CTLF", "SatTransf",

  // Tireoide e paratireoide
  "T3", "T4L", "TSH", "PTH", "AntiTg",

  // Vitaminas e reservas
  "Ferritina", "Folato", "B12", "VitD",

  // Outros
  "CPK", "IgG", "IgA", "IgM", "IgE",

  // Sorologias qualitativas (ordem clínica fixa)
  "_QUAL_HBsAg", "_QUAL_AntiHBc", "_QUAL_HCV", "_QUAL_HIV", "_QUAL_Sifilis",
  "_QUAL_FANcrith", "_QUAL_FANhep2",
  "_QUAL_AntiRNP", "_QUAL_AntiSm", "_QUAL_AntiSSA", "_QUAL_AntiSSB",
  "_QUAL_AntiJO1", "_QUAL_AntiSCL70",

  // Microbiológicos são adicionados ao final em ordem de aparição
];

// Diferenciais do leucograma — ordem e rótulos
const LEUCO_ORDER  = ["neut", "eos", "baso", "linf", "mono"];
const LEUCO_LABELS = { neut: "neut.", eos: "eos.", baso: "baso", linf: "linf.", mono: "mono" };

/* ─── Normalização de resultado qualitativo ──────────────────── */
// Por que array de pares e não objeto:
// a ordem importa — "não reagente" deve ser testado antes de "reagente"
const QUAL_NORMALIZE_MAP = [
  [/n[ãa]o\s*reagente/i,            "NR"],
  [/n[ãa]o\s*houve\s+crescimento/i, "NEG"],
  [/negati/i,                        "NEG"],
  [/positiv/i,                       "POS"],
  [/inconclusiv/i,                   "INCONCL"],
  [/reagente/i,                      "R"],
];

function normalizeQual(str) {
  for (const [pattern, label] of QUAL_NORMALIZE_MAP) {
    if (pattern.test(str)) return label;
  }
  return str.trim().slice(0, 20);
}

/* ─── Materiais biológicos reconhecidos pelo segmentador ─────── */
// Por que regex e não lista: permite match parcial de início de string
// com uma única chamada, mais eficiente que loop de strings
const MATERIAL_REGEX = /^(sangue|soro|urina|plasma|lcr|escarro|fezes|swab|liquor|liquido|medula|lavado|aspirado|tecido|cateter)/i;

// Abreviações de material para exibição nos microbiológicos
const MATERIAL_ABBREV = [
  [/lavado\s+broncoalveolar/i, "LBA"],
  [/lavado/i,                  "Lavado"],
  [/escarro/i,                 "Escarro"],
  [/sangue/i,                  ""],       // implícito — não exibir
  [/urina/i,                   "Urina"],
  [/swab/i,                    "Swab"],
  [/aspirado/i,                "Aspirado"],
  [/lcr|liquor/i,              "LCR"],
];

function abbreviateMaterial(materialStr) {
  for (const [pattern, abbrev] of MATERIAL_ABBREV) {
    if (pattern.test(materialStr)) return abbrev;
  }
  return materialStr.slice(0, 12).trim();
}

// Exportação para uso nos outros módulos (via <script> no browser)
// No browser, estas variáveis ficam no escopo global quando carregadas
// via <script src="js/aliases.js"> antes dos outros módulos.
