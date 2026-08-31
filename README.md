# DOC Intelligence - API (Trilha A)

Fatia vertical da API do serviço de inteligência documental, desenvolvida com NestJS, Prisma, PostgreSQL e BullMQ (Fila com Redis) para processamento assíncrono. 

## 🛠 Pré-requisitos

Certifique-se de ter os seguintes itens instalados na sua máquina:
* **Node.js** (versão 24.20.0 ou superior)
* **Docker** e **Docker Compose**
* **Git**

## 🚀 Como rodar o projeto localmente

Siga o passo a passo abaixo para levantar a infraestrutura e a aplicação:

**1. Clone o repositório e acesse a pasta**
\`\`\`bash
git clone https://github.com/erikmaia15/DOC-Intelligence.git
cd doc-Intelligence
\`\`\`

**2. Instale as dependências**
\`\`\`bash
npm install
\`\`\`

**3. Configure as Variáveis de Ambiente**
Crie um arquivo chamado `.env` na raiz do projeto e insira as variáveis abaixo (preenchendo a senha do banco conforme configurado no Docker):
\`\`\`env
# URL DE CONEXAO DO BANCO
DATABASE_URL="postgresql://doc_intelligence:doc_intelligence@localhost:5433/doc_intelligence?schema=public"

# Redis — usado pelo BullMQ
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Configuração da IA Mockada
STUB_AI_CONFIDENCE=0.95

# Porta da aplicação NestJS
PORT=3000
NODE_ENV=development
\`\`\`

**4. Suba a infraestrutura (PostgreSQL e Redis)**
\`\`\`bash
cd db
docker compose up -d
cd ..
\`\`\`

**5. Sincronize o Banco de Dados (Prisma)**
Como o banco de dados acabou de ser criado pelo Docker, gere a estrutura das tabelas:
\`\`\`bash
npx prisma migrate dev
Esse comando respeita o versionamento do prisma!
\`\`\`

**6. Inicie a aplicação**
\`\`\`bash
npm run start:dev
\`\`\`

## 📚 Documentação da API (Swagger)
Com a aplicação rodando, acesse o contrato interativo da API (Swagger UI) em:
👉 **[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

---

## 🧪 Sobre os Testes (Decisões de Cobertura)

Para rodar os testes, execute:
\`\`\`bash
npm run test
\`\`\`

**O que escolhi testar, e por quê:**
Dado o escopo de tempo, a estratégia de testes unitários (`vitest`) ignorou o boilerplate padrão de CRUD e focou estritamente nos cenários que protegem as regras de negócio centrais e mitigam os fatos mapeados do ambiente: 
1. **Deduplicação por hash:** Garante que o mesmo documento não seja reprocessado, economizando recursos e lidando com a repetição de envios por parte dos clientes.
2. **Roteamento de confiança:** Valida se a IA (dublê) com pontuação abaixo da linha de corte envia o documento para o status `NEEDS_REVIEW` em vez de publicá-lo diretamente, protegendo a qualidade dos dados extraídos.
3. **Concorrência e Locks:** Verifica se o `ReviewService` devolve um erro de conflito (`409`) ao tentar realizar o *claim* de um documento já travado por outro operador humano.
4. **Retry do Worker (BullMQ):** Simula a instabilidade da IA externa, garantindo que exceções acionem o mecanismo de retentativas do worker e, ao esgotar o limite, roteiem o documento de forma segura para o status `FAILED` sem derrubar a aplicação.