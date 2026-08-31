No DocumentsController e DocumentsService, encontrei dois problemas ao testar o upload via Postman com um arquivo real anexado (campo file, tipo File, form-data):

A requisição retorna 201 Created, mas o corpo é {"message":"Field name missing","error":"Bad Request","statusCode":400} — status HTTP e corpo estão inconsistentes. Corrija todo lugar do código que retorna um objeto de erro construído manualmente (com statusCode, error, message) em vez de lançar uma exceção do NestJS (BadRequestException, NotFoundException, etc.). O status HTTP deve refletir o erro real.
Investigue por que o arquivo não está sendo reconhecido mesmo enviado corretamente como file/form-data com key file — confirme se @UseInterceptors(FileInterceptor('file')) está presente no create() do controller e se o nome do campo bate exatamente com 'file'.

Antes de corrigir, me explique brevemente a causa raiz de cada um dos dois problemas.