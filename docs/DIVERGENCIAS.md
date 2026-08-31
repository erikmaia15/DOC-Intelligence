# Divergências entre Especificação e Implementação

## Framework de testes: Jest → Vitest
`docs/ARCHITECTURE.md` registra a decisão de usar CommonJS + Jest. Na prática,
o scaffold gerado pelo `nest new` (via Antigravity) resultou em um projeto
ESM + Vitest, com suporte nativo a SWC. Percebido ao rodar `npm run test` e
ver `vitest run` no output, em vez de Jest.

**Decisão:** manter Vitest, não reverter. Motivo: Vitest+SWC nesse boilerplate
é mais rápido e já está funcionando corretamente (times, mocks e isolamento
validados nos primeiros testes escritos). Reverter agora custaria tempo sem
ganho real, dado o prazo. A escolha original (seção de stack do
`ARCHITECTURE.md`) permanece como registro do raciocínio original, não como
o que foi de fato implementado.