/**
 * example.js — Texto de exemplo para o botão "Carregar exemplo"
 *
 * Cobre todos os tipos de bloco suportados na v3:
 * hemograma, exames simples, eletrólitos, coagulograma (ambos os formatos),
 * gasometria, bilirrubinas, PCR, sorologias, microbiológicos.
 */

"use strict";

const EXEMPLO = `HOSPITAL DO SERVIDOR PÚBLICO ESTADUAL - FMO
LABORATÓRIO BIOFAST - PRONTO SOCORRO
Responsável Técnico: Dra. Edileia Teixeira Candil Dias - CRF-SP: 68833
Av. Ibirapuera 981 - Indianópolis - 04029-000 - São Paulo - SP
Prontuário:2126809 Paciente: DARIO PEREIRA DA ROCHA
Data Nasc.: 29/04/1956 Sexo:M Idade: 69a 11m 3d Data Solicitação: 31/03/2026 - 19:45
Solicitante: Dr.(a): HENRIQUE SOARES DE LIMA - CRM N°: 278433
Pedido: 260098485 - Emissão: 01/04/2026-11:09 Atendimento: 10478566
WELLINGTON OLIVEIRA PAIXAO
CRBM 25217
Os resultados devem ser interpretados em conjunto com o histórico clínico do paciente.
PROTEÍNA C REATIVA, PLASMA HEPARINIZADO
Coletado em: 31/03/2026 20:11 Liberado em: 31/03/2026 21:02
Resultado Resultados anteriores Valores de referência Método
46.74 mg/dL 7.68 (15/03/2026) Inferior a 0,5 mg/dL* Turbidimetria
__________________________________________________________________________________________________________________
GAMA GT (GGT), PLASMA HEPARINIZADO
Coletado em: 31/03/2026 20:11 Liberado em: 31/03/2026 20:55
Resultado Resultados anteriores Valores de referência Método
466 U/L 358 (15/03/2026) 8 a 61 U/L Colorimétrico Enzimático
__________________________________________________________________________________________________________________
FOSFATASE ALCALINA (FAL), PLASMA HEPARINIZADO
Coletado em: 31/03/2026 20:11 Liberado em: 31/03/2026 20:55
Resultado Resultados anteriores Valores de referência Método
246 U/L 196 (15/03/2026) 40 a 129 U/L Colorimétrico Enzimático
__________________________________________________________________________________________________________________
CREATININA, PLASMA HEPARINIZADO
Coletado em: 31/03/2026 20:11 Liberado em: 31/03/2026 20:52
Resultado Resultados anteriores Valores de referência Método
7,09 mg/dL 4,04 (15/03/2026) 0,70 a 1,20 mg/dL Colorimétrico Enzimático
__________________________________________________________________________________________________________________
ASPARTATO AMINO TRANSFERASE (TGO), PLASMA HEPARINIZADO
Coletado em:31/03/2026 20:11 Liberado em: 31/03/2026 20:55
Resultado Resultados anteriores Valores de referência Método
127 U/L 36 (15/03/2026) Até 50 U/L Colorimétrico Enzimático
__________________________________________________________________________________________________________________
ALANINO AMINO TRANSFERASE (TGP), PLASMA HEPARINIZADO
Coletado em: 31/03/2026 20:11 Liberado em: 31/03/2026 20:55
Resultado Resultados anteriores Valores de referência Método
42 U/L 23 (15/03/2026) Até 50 U/L Colorimétrico Enzimático
__________________________________________________________________________________________________________________
URÉIA, PLASMA HEPARINIZADO
Coletado em: 31/03/2026 20:11 Liberado em: 31/03/2026 20:47
Resultado Resultados anteriores Valores de referência Método
214,8 mg/dL 53,5 (15/03/2026) 16,6 a 48,5 mg/dL Colorimétrico Enzimático
__________________________________________________________________________________________________________________
SÓDIO, PLASMA HEPARINIZADO
Coletado em: 31/03/2026 20:11 Liberado em: 31/03/2026 20:47
Resultado Resultados anteriores Valores de referência Método
142 mmol/L 135 (15/03/2026) 136 a 145 mmol/L Eletrodo íon seletivo (ISE)
__________________________________________________________________________________________________________________
POTÁSSIO, PLASMA HEPARINIZADO
Coletado em: 31/03/2026 20:11 Liberado em: 31/03/2026 20:47
Resultado Resultados anteriores Valores de referência Método
5,9 mmol/L 3,6 (15/03/2026) 3,5 a 5,1 mmol/L Eletrodo íon seletivo (ISE)
__________________________________________________________________________________________________________________
HEMOGRAMA,SANGUE TOTAL EDTA
Coletado em: 31/03/2026 20:11 Liberado em: 31/03/2026 20:42
Método: Análise automatizada e eventual estudo morfológico em esfregaços com corantes panóticos.
ERITROGRAMA
Resultados Resultado anterior Valores de referência
Hemoglobina 14,2 g/dL 14,3 (15/03/2026) 13,5 a 17,5 g/dL
Hematócrito 42,1 % 41,8 (15/03/2026) 41,0 a 53,0 %
VCM 89,2 fL 95 (15/03/2026) 80 a 100 fL
HCM 30,1 pg 32,5 (15/03/2026) 26,0 a 34,0 pg
CHCM 33,7 g/dL 34,2 (15/03/2026) 31,0 a 37,0 g/dL
RDW-CV 13,3 % 11,9 (15/03/2026) 11,5 a 14,5 %
LEUCOGRAMA
LEUCÓCITOS 100 % 14720 /mm³ 7880 (15/03/2026) 5.000 a 10.000 /mm³
Neutrófilos 82,8 % 12188 /mm³ 4752 (15/03/2026) 1.800 a 10.000 /mm³
Eosinófilos 0,2 % 29 /mm³ 71 (15/03/2026) 0.000 a 600 /mm³
Basófilos 0,2 % 29 /mm³ 63 (15/03/2026) 0.000 a 200 /mm³
Linfócitos 10,4 % 1531 /mm³ 2191 (15/03/2026) 1.000 a 5.000 /mm³
Monócitos 6,4 % 942 /mm³ 804 (15/03/2026) 80 a 1.200 /mm³
PLAQUETAS Valores de referência
Resultados: 186.000 /mm³ 150.000 a 450.000 /mm³
WELLINGTON OLIVEIRA PAIXAO
CRBM 25217
TEMPO DE ATIVIDADE DE PROTROMBINA, PLASMA CITRATADO
Coletado em: 31/03/2026 20:11 Liberado em: 31/03/2026 20:52
Resultado Resultados anteriores Valores de referência Método
Atividade protrombinica 50,7 % 87,1 (15/03/2026) 70% a 100% Coagulométrico
INR 1,39 1,07 (15/03/2026) 0,96 a 1,30
__________________________________________________________________________________________________________________
TEMPO DE TROMBOPLASTINA PARCIAL ATIVADO, PLASMA CITRATADO
Coletado em: 31/03/2026 20:11 Liberado em: 31/03/2026 21:03
Resultado Valores de referência Método
TTPA 59.30 seg 25,1 a 35,3 seg Coagulorimétrico
Razão 1,81 0,85 a 1,26
Resultados anteriores (razão):
WELLINGTON OLIVEIRA PAIXAO
CRBM 25217
GASOMETRIA VENOSA, SANGUE VENOSO
Coletado em: 31/03/2026 20:11 Liberado em: 01/04/2026 00:24
Método: Potenciometria (eletrodo ion seletivo), Amperometria e cálculo pela equação de Henderson-Hasselbalch
Resultado Resultados Anteriores Valores de referência
pH 7,215 7,372 (15/03/2026) 7,320 a 7,430
pCO2 45,4 mmHg 50,4 (15/03/2026) 41,00 a 51,00 mmHg
pO2 28,9 mmHg 19,7 (15/03/2026) 25,00 a 40,00 mmHg
HCO3 18 mmol/L 28,6 (15/03/2026) 22,00 a 29,00 mmol/L
BE -9.8 mmol/L 2.4 (15/03/2026) 0 a +/- 4mmol/L
sO2 46,7 % 29,6 (15/03/2026) 40,00 a 70,00%
__________________________________________________________________________________________________________________
CÁLCIO IONIZADO, PLASMA HEPARINIZADO
Coletado em: 31/03/2026 20:11 Liberado em: 01/04/2026 00:49
Resultado Valores de referência Método
1,15 mmol/L 1,15 - 1,33 mmol/L Íon eletrodo seletivo
Resultados anteriores:
WELLINGTON OLIVEIRA PAIXAO
CRBM 25217
LACTATO, SANGUE ARTERIAL
Coletado em: 31/03/2026 20:11 Liberado em: 01/04/2026 00:25
Resultado Resultados anteriores Valores de referência Método
4,76 mmol/L 0,36 a 1,75 mmol/L Potenciometria
WELLINGTON OLIVEIRA PAIXAO
CRBM 25217`;
