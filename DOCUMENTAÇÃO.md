# Documentação do Projeto - report-web

## Visão Geral

**report-web** é um sistema full-stack desenvolvido para geração e recuperação de relatórios via serviços SOAP (IwsReport) da plataforma TOTVS. O projeto foi criado para uso interno da empresa, implementando uma solução completa com autenticação, autorização, geração de relatórios e interface moderna.

## Arquitetura do Sistema

### Stack Tecnológico

**Backend:**

- **Framework**: FastAPI (Python)
- **Banco de Dados**: Microsoft SQL Server 2022
- **ORM**: SQLAlchemy 2.0.44
- **Migrações**: Alembic 1.17.2
- **Autenticação**: JWT (python-jose), bcrypt, pyotp (2FA)
- **Servidor Web**: Uvicorn

**Frontend:**

- **Framework**: React 19.2.0 com TypeScript
- **Roteamento**: React Router DOM 7.9.6
- **Estilização**: Tailwind CSS 4.1.17
- **Build Tool**: Vite 7.2.4
- **HTTP Client**: Axios 1.13.2
- **Ícones**: Lucide React, React Icons

**Infraestrutura:**

- **Containerização**: Docker & Docker Compose
- **Redes**: Bridge networks (frontend-network, backend-network)
- **Volumes**: Persistência de dados SQL Server


## Fluxo do WebService TOTVS
![Diagrama do fluxo do WebService TOTVS](https://i.ibb.co/s9yCsbJG/Untitled-diagram-2026-02-05-183838.png)


## Estrutura do Projeto

```
report-web/
├── backend/              # API FastAPI
│   ├── app/
│   │   ├── main.py      # Aplicação principal FastAPI
│   │   ├── api/         # Rotas da API
│   │   │   └── v1/routes/
│   │   │       ├── auth.py       # Autenticação e 2FA
│   │   │       └── routers.py    # Relatórios
│   │   ├── auth/        # Sistema de autenticação
│   │   │   ├── security.py           # JWT tokens
│   │   │   └── two_factor_auth.py    # 2FA/QR Code
│   │   ├── core/        # Configurações
│   │   │   └── cors.py
│   │   ├── dependecy/   # Dependências
│   │   │   ├── authVerify.py    # Verificação de tokens
│   │   │   └── database.py      # Conexão DB
│   │   ├── models/      # Modelos SQLAlchemy
│   │   │   ├── usuarios.py
│   │   │   └── preferencias.py
│   │   ├── schemas/     # Schemas Pydantic
│   │   │   ├── login_schema.py
│   │   │   ├── report_schema.py
│   │   │   └── env_schema.py
│   │   └── services/    # Lógica de negócio
│   │       ├── generate_report.py
│   │       ├── get_all_reports.py
│   │       ├── get_generated_report_size.py
│   │       ├── get_report_file_chunk.py
│   │       ├── get_user.py
│   │       └── email_service.py
│   ├── migrations/      # Migrações Alembic
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/            # Aplicação React
│   ├── src/
│   │   ├── App.tsx      # Componente principal + rotas
│   │   ├── main.tsx     # Entry point
│   │   ├── components/  # Componentes reutilizáveis
│   │   │   ├── Header.tsx
│   │   │   ├── SearchComponent.tsx
│   │   │   ├── RelatorioCard.tsx
│   │   │   ├── GenerateReportModal.tsx
│   │   │   ├── ModalNotification.tsx
│   │   │   ├── SkeletonCard.tsx
│   │   │   ├── ErrorMessage.tsx
│   │   │   └── Switch.tsx
│   │   ├── contexts/    # Context API
│   │   │   ├── authContexts.ts
│   │   │   ├── authProviders.tsx
│   │   │   └── PrivateRoute.tsx
│   │   ├── pages/       # Páginas da aplicação
│   │   │   ├── Login.tsx
│   │   │   ├── Home.tsx
│   │   │   ├── Settings.tsx
│   │   │   ├── TwoFactorAuth.tsx
│   │   │   ├── ShowQrCode.tsx
│   │   │   ├── ForgotPassword.tsx
│   │   │   ├── ResetPassword.tsx
│   │   │   └── NotFound.tsx
│   │   ├── services/    # Serviços de API
│   │   │   └── api.ts
│   │   ├── types/       # TypeScript types
│   │   │   ├── relatorio.ts
│   │   │   └── usuario.ts
│   │   └── hooks/       # Custom hooks
│   │       └── useAuth.ts
│   ├── package.json
│   └── Dockerfile
│
└── docker-compose.yaml  # Orquestração dos serviços
```

## Sistema de Autenticação

### Fluxo de Autenticação

1. **Login Inicial** (`/auth/login`)

   - Usuário fornece email e senha
   - Backend valida credenciais com bcrypt
   - Retorna access_token (15min) e refresh_token (7 dias)

2. **Autenticação de Dois Fatores (2FA)**

   - Disponível apenas para emails `@brightbee.com.br`
   - Geração de QR Code com pyotp
   - Armazenamento do segredo OTP no banco de dados
   - Validação de tokens TOTP de 6 dígitos

3. **Refresh de Token** (`/auth/refresh`)

   - Renovação automática do access_token
   - Implementação de fila para múltiplas requisições simultâneas
   - Fallback para re-login em caso de falha

4. **Proteção de Rotas**
   - Frontend: `PrivateRoute` component
   - Backend: Dependency `get_current_user`

### Endpoints de Autenticação

```
POST /auth/login              # Login inicial
POST /auth/refresh            # Renovar tokens
GET  /auth/me                 # Dados do usuário atual
GET  /auth/2fa/qrcode         # Obter QR Code 2FA
POST /auth/2fa/validate       # Validar código 2FA
POST /auth/forgot-password    # Recuperação de senha
POST /auth/reset-password     # Resetar senha
```

## Sistema de Relatórios

### Integração SOAP TOTVS

O sistema se conecta ao serviço SOAP TOTVS para gerar relatórios:

**URL Base**: `https://bbsltda149898.rm.cloudtotvs.com.br:8051/wsReport/IwsReport`

**Operações SOAP:**

- `GenerateReport`: Gera relatório e retorna GUID
- `GetGeneratedReportSize`: Obtém tamanho do arquivo gerado
- `GetFileChunk`: Lê chunks do arquivo (streaming)

### Endpoints de Relatórios

```
POST /report/generate/{id_report}    # Gerar novo relatório
POST /report/chunk/                  # Obter chunk do arquivo
POST /report/export                  # Exportar PDF
GET  /report                         # Listar relatórios disponíveis
```

### Fluxo de Geração de Relatório

1. Cliente solicita geração (`POST /report/generate/{id}`)
2. Backend chama SOAP `GenerateReport` → retorna GUID
3. Backend chama SOAP `GetGeneratedReportSize` → retorna tamanho
4. Cliente recebe `{ guid, file_size }`
5. Cliente solicita chunks em sequência
6. Cliente reconstrói o arquivo completo (PDF base64)
7. Cliente exporta PDF via endpoint `/report/export`


## Containerização

### Serviços Docker Compose

**api (Backend)**

- Porta: 127.0.0.1:8000
- Dependências: sqlserver
- Health Check: curl http://localhost:8000/docs
- Limites: 0.5 CPU, 512M RAM
- Security: no-new-privileges, read-only filesystem

**frontend**

- Portas: 127.0.0.1:3000, 127.0.0.1:5173
- Build: Vite production build
- Redes: frontend-network, backend-network

**sqlserver**

- Imagem: mcr.microsoft.com/mssql/server:2022-latest
- Porta: 1433
- Credenciais: SA_PASSWORD=MyStr0ng!Pass123word
- Volume: sqlserver_data (persistente)
- Health Check: sqlcmd SELECT 1

### Redes

- **backend-network**: api ↔ sqlserver
- **frontend-network**: frontend ↔ api

## Interface do Usuário

### Páginas

1. **Login** (`/login`)

   - Formulário de autenticação
   - Link para recuperação de senha
   - Redirecionamento pós-login

2. **Home** (`/`)

   - Lista de relatórios disponíveis
   - Busca e filtros
   - Cards de relatórios com ações
   - Modal de geração de relatórios

3. **Settings** (`/settings`)

   - Configurações do usuário
   - Gerenciamento de preferências

4. **2FA Pages**

   - `/2fa/qrcode`: Exibição do QR Code
   - `/2fa/validate`: Validação do código TOTP

5. **Password Recovery**
   - `/forgot-password`: Solicitar recuperação
   - `/reset-password`: Definir nova senha

### Componentes Principais

**Header**

- Navegação principal
- Logout
- Informações do usuário

**SearchComponent**

- Busca em tempo real
- Filtros por múltiplos campos

**RelatorioCard**

- Exibição de informações do relatório
- Botões de ação (gerar, download)
- Status e metadados

**GenerateReportModal**

- Interface para geração de relatórios
- Progress bar
- Tratamento de erros

**ModalNotification**

- Notificações de sucesso/erro
- Auto-dismiss
- Feedback visual

## Configuração e Variáveis de Ambiente

### Backend (.env)

```bash
# Database
DATABASE_URL=mssql+pyodbc://...

# JWT
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15

# TOTVS
TOTVS_URL=https://bbsltda149898.rm.cloudtotvs.com.br:8051/wsReport/IwsReport
TOTVS_USERNAME=...
TOTVS_PASSWORD=...

# Email (opcional)
SMTP_HOST=...
SMTP_PORT=587
```

### Frontend (.env)

```bash
VITE_API_URL=http://localhost:8000
```

## Como Executar

### Com Docker (Recomendado)

```powershell
# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

**URLs:**

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Desenvolvimento Local

**Backend:**

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**

```powershell
cd frontend
npm install
npm run dev
```

## Dependências Principais

### Backend (Python)

```
fastapi==0.122.0          # Framework web
uvicorn==0.38.0           # ASGI server
sqlalchemy==2.0.44        # ORM
alembic==1.17.2           # Migrações
pyodbc>=5.0.1             # Driver SQL Server
bcrypt==5.0.0             # Hash de senhas
python-jose==3.5.0        # JWT
pyotp==2.9.0              # 2FA/TOTP
qrcode>=7.4.2             # Geração QR Code
requests==2.32.5          # Cliente HTTP (SOAP)
pydantic==2.12.4          # Validação de dados
```

### Frontend (Node.js)

```json
{
  "react": "19.2.0",
  "react-router-dom": "7.9.6",
  "axios": "1.13.2",
  "typescript": "5.9.3",
  "vite": "7.2.4",
  "tailwindcss": "4.1.17",
  "lucide-react": "0.559.0"
}
```

## Segurança

### Implementações de Segurança

1. **Autenticação JWT**

   - Access tokens de curta duração (15min)
   - Refresh tokens de longa duração (7 dias)
   - Tokens armazenados em localStorage

2. **Proteção de Senhas**

   - Hash bcrypt com salt
   - Validação no backend

3. **2FA (TOTP)**

   - Baseado em tempo
   - Segredos únicos por usuário
   - Restrição por domínio de email

4. **CORS**

   - Configuração de origens permitidas
   - Headers de segurança

5. **Container Security**

   - no-new-privileges
   - read-only filesystem
   - tmpfs para arquivos temporários
   - Limites de recursos

6. **SQL Server**
   - Senha forte

- Healthcheck
- Volume persistente

## Tratamento de Erros

### Backend

- HTTPException para erros de API
- Logging com uvicorn.error logger
- Validação de dados com Pydantic
- Try-catch em serviços SOAP

### Frontend

- Interceptors axios para 401/403
- Renovação automática de tokens
- Estados de loading/error
- Mensagens user-friendly
- Fallback para login em caso de falha crítica

## Logging

**Backend:**

- Logger: `uvicorn.error`
- Eventos logados:
  - Tentativas de login
  - Geração de relatórios
  - Erros em serviços SOAP
  - Operações 2FA

**Frontend:**

- Console logs para desenvolvimento
- Tracking de erros de autenticação
- Debug de requisições falhas


### Possíveis Melhorias Futuras

- [ ] Testes unitários e integração
- [ ] CI/CD pipeline
- [ ] Rate limiting
- [ ] Websockets para progresso real-time
- [ ] Dashboard de analytics
- [ ] Agendamento de relatórios
- [ ] Notificações por email

## Fluxo de Dados Completo

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
│   Browser   │────▶│   Frontend   │────▶│   Backend    │────▶│  TOTVS   │
│   (React)   │◀────│   (Vite)     │◀────│  (FastAPI)   │◀────│  (SOAP)  │
└─────────────┘     └──────────────┘     └──────────────┘     └──────────┘
                            │                     │
                            │                     │
                            ▼                     ▼
                    ┌──────────────┐     ┌──────────────┐
                    │ localStorage │     │  SQL Server  │
                    │  (tokens)    │     │  (usuários)  │
                    └──────────────┘     └──────────────┘
```


## Licença e Propriedade

Projeto proprietário interno da empresa Bright Bee School.
Desenvolvido para uso exclusivo da organização.

---

**Data de Criação**: 08/2025
**Última Atualização**: 02/2026
**Tecnologias Principais**: React 19, FastAPI, SQL Server, Docker
