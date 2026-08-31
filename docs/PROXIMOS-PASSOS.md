# Próximos Passos — Checklist de Entrega

> O edital exige **5 itens** na entrega (seção "O que entregar"). Este arquivo cruza cada um com o que já está definido (nos outros 3 arquivos) e o que ainda falta fazer.

---

## Os 5 documentos/itens que o edital pediu — status atual

| # | Item exigido pelo edital | O que já está pronto | O que falta |
|---|---|---|---|
| 1 | **Repositório Git** com histórico de commits real (não um único "initial") | — | Criar o repo, `.gitignore`, e **commitar em etapas separadas** à medida que for construindo (setup → schema → módulos → docs). Não deixar para o final. |
| 2 | **Especificação + ADRs** — decisões, alternativas descartadas e por quê | ✅ `ARCHITECTURE.md` cobre isso (stack, fatos do ambiente, modelo de dados, contrato de API, o que fica de fora) | Revisar se ficou algo sem justificativa; manter este arquivo **imutável** depois que a implementação começar — se divergir, registrar em `DIVERGENCIAS.md`, não editar o original. |
| 3 | **Fatia vertical rodando** + README de setup + parágrafo do que foi testado e por quê | ✅ Escopo definido em `FEATURES.md` (o que entra/fica fora, e o que testar) | Implementar o código; escrever o `README.md` real do projeto (instalação, `docker compose up`, como rodar, endpoints); copiar/adaptar o parágrafo de testes de `FEATURES.md` seção 4 para o README. |
| 4 | **Registro de uso de IA**: arquivos de instrução do agente, prompts na íntegra e em ordem, parágrafo sobre onde o agente errou | Parcial — `NESTJS-BEST-PRACTICES.md` e este conjunto de docs servem de instrução, mas ainda faltam os artefatos formais abaixo | Ver seção "Registro de IA" abaixo. |
| 5 | **Carta de fechamento** (máx. 2 páginas, PDF, Roboto 11, espaçamento 1,15, parágrafos 6pt, justificado) respondendo a 4 perguntas | — | Escrever só ao final, depois de codar — as respostas dependem do que de fato aconteceu. Ver seção "Carta de fechamento" abaixo. |

---

## O que ainda falta fazer — em ordem prática

### A. Estrutura e setup (antes de codar)
- [ ] Criar repositório Git (nome sugerido: `doc-intelligence`)
- [ ] Adicionar os 4 arquivos que já geramos na raiz do repo: `ARCHITECTURE.md`, `FEATURES.md`, `NESTJS-BEST-PRACTICES.md`, `PROXIMOS-PASSOS.md`
- [ ] Criar `AGENTS.md` (ou `CLAUDE.md`, se o Antigravity ler esse nome) na raiz, apontando para `ARCHITECTURE.md` e `NESTJS-BEST-PRACTICES.md` como fonte de verdade para o agente que vai codar
- [ ] Criar diretório `prompts/` no repo — é onde os prompts reais serão salvos, na íntegra e em ordem (não é este chat; são os prompts que você vai dar ao Antigravity)
- [ ] Scaffold do NestJS + Prisma + `docker-compose.yml` (postgres + redis)

### B. Implementação (a fatia vertical, conforme `FEATURES.md`)
- [ ] `DocumentsModule`: upload + validação + dedupe por hash
- [ ] `AiModule`: `AiPort` + `StubAiAdapter`
- [ ] `ProcessingModule`: fila BullMQ + worker + retry/backoff
- [ ] `ReviewModule`: fila de conferência + claim (TTL) + correção
- [ ] Migrations Prisma versionadas
- [ ] `README.md` do projeto (setup, como rodar, contrato de API, parágrafo de testes)
- [ ] Testes dos 4 cenários prioritários listados em `FEATURES.md` seção 4

### C. Registro de uso de IA (item 4 da entrega)
- [ ] Versionar `AGENTS.md`/`CLAUDE.md` no repo (arquivo de instrução do agente)
- [ ] Salvar em `prompts/` **todos os prompts reais** dados ao Antigravity, em ordem cronológica, **exatamente como escritos** — não reescrever depois para parecer mais bonito. Sugestão: um arquivo por sessão/tarefa, ex. `prompts/01-scaffold.md`, `prompts/02-documents-module.md`, etc.
- [ ] Ao longo do trabalho, anotar (num arquivo `prompts/erros-do-agente.md` ou dentro do README) onde o agente errou, como você percebeu, e o que fez a respeito — vira insumo direto do item 4

### D. Carta de fechamento (item 5 da entrega — fazer por último)
Responder, em até 2 páginas, PDF, Roboto 11, espaçamento 1,15, parágrafos 6pt, justificado:
- [ ] O que ficou de fora e por quê → puxar de `FEATURES.md` seção 3
- [ ] O que quebra primeiro se o volume for multiplicado por 10 → provavelmente o worker único / ausência de escalonamento e a falta de teste de carga (já antecipado em `FEATURES.md`)
- [ ] Qual decisão você menos defenderia hoje → decidir isso só depois de codar, com honestidade
- [ ] Quanto tempo isso tudo levou → registrar horas reais gastas por dia

### E. Antes de enviar
- [ ] Revisar histórico de commits — conta uma história coerente?
- [ ] Conferir que nenhum dado real de cliente/pessoa física foi usado — só documentos fictícios
- [ ] Conferir que tudo que não foi feito está **escrito** como não feito (em `FEATURES.md` e na carta)
- [ ] Liberar acesso do repositório (link público ou convite)
- [ ] Enviar por e-mail: link do repo + carta de fechamento em PDF

---
