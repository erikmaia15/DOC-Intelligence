Antes de codar, leia docs/ARCHITECTURE.md seção 2 (Fato g) e seção 4 (rotas /review-queue), docs/NESTJS-BEST-PRACTICES.md seção 5 (exceptions específicas mapeadas para status HTTP certos).

Cria o ReviewModule em src/modules/review/:

GET /review-queue — lista documentos com status: NEEDS_REVIEW que não têm ReviewClaim ativo (isto é, sem claim, ou com claim expirado — expiresAt < now()).
POST /review-queue/:id/claim — cria um ReviewClaim para o documento, com lockedBy (recebido no body, ex. { "reviewerId": "string" }), lockedAt: now(), expiresAt: now() + 5 minutos. Se já existir um claim ativo de outro lockedBy, retorne 409 Conflict. Se o claim existente for do mesmo lockedBy, renove o expiresAt (permitir "renovar" a própria sessão de revisão).
POST /review-queue/:id/correct — recebe { "reviewerId": "string", "correctedFields": object }. Exige claim ativo e pertencente a esse reviewerId (senão 404 se não houver claim, 403 se o claim for de outro revisor). Salva correctedFields no ReviewClaim, marca reviewedBy e reviewedAt, e atualiza Document.status para READY.
Use exceptions específicas (ClaimNotFoundException, ClaimConflictException, ClaimForbiddenException) mapeadas nos status corretos, conforme a seção 5 do NESTJS-BEST-PRACTICES.md.

Antes de gerar o código, me explique como o expiresAt evita que um documento fique travado para sempre se um revisor abrir a fila e nunca voltar (ex.: fechar a aba do navegador no meio da revisão).