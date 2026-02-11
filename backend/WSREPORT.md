## Integração com wsReport (TOTVS) — como o projeto consome o serviço

Este documento descreve, em alto nível e com exemplos práticos, como a API deste projeto consome o serviço wsReport (IwsReport) da TOTVS. Ele reúne a convenção usada no código existente em `app/services/` e as variáveis de ambiente em `.env`.

### Arquivos relevantes

- `app/services/generate_report.py` — constrói o XML para gerar relatórios (função `definer_params` e `generate_report`).
- `app/services/get_metadata_reports.py` — monta e envia o `GetReportInfo` para recuperar metadados do relatório.
- `app/services/get_all_reports.py` — monta/consome `GetReportList`.
- `app/services/get_generated_report_size.py` — consulta `GetGeneratedReportSize` para obter tamanho do relatório gerado.
- `app/services/get_report_file_chunk.py` — recupera blocos do arquivo via `GetFileChunk`.
- `app/main.py` e `app/api/v1/routes/routers.py` — rotas expostas que acionam a integração (ex.: `/report/generate/{id_report}/{codColigada}`, `/report/chunk/`, `/report/metadata/{codColigada}/{idReport}`).
- `app/schemas/env_schema.py` e `.env` — variáveis de configuração (URL, credenciais, flags SSL, header Authorization hardcoded).

### Variáveis de ambiente (exemplo `.env`)

- `TOTVS_URL` — URL do serviço wsReport (ex.: `https://.../wsReport/IwsReport`).
- `TOTVS_USERNAME`, `TOTVS_PASSWORD` — credenciais usadas na autenticação HTTP básica (passadas como `auth=(user, password)` nas chamadas `requests`).
- `AUTH_HARDCODED` — valor usado para o header `Authorization` em algumas chamadas (ex.: `Basic bWVzdHJlOjEyM3QwdHZz`).
- `SOAP_VERIFY_SSL` — bool para `verify=` nas chamadas `requests.post` (True/False).

No projeto essas variáveis são carregadas por `app/schemas/env_schema.py` (classe `Settings`) e referenciadas em `app/services/*` como `settings.TOTVS_URL`, `settings.AUTH_HARDCODED`, etc.

### Padrão das requisições SOAP

As chamadas seguem um padrão consistente usado nas funções de `app/services/*`:

- Conteúdo: XML (string) no corpo da requisição.
- Headers:
  - `Content-Type: text/xml;charset=UTF-8`
  - `SOAPAction`: valor específico por operação (ex.: `"http://www.totvs.com/IwsReport/GetReportInfo"`).
  - `Accept-Encoding: gzip, deflate`
  - `Authorization`: normalmente `settings.AUTH_HARDCODED` (se necessário)
  - `Content-Length`: comprimento do XML (opcional, mas presente no projeto)
  - `Host`, `Connection`, `User-Agent` (opcionais, mas vistos no código)

- Autenticação HTTP: em muitas chamadas a função `requests.post` é feita com `auth=AUTH` onde `AUTH = (settings.TOTVS_USERNAME, settings.TOTVS_PASSWORD)`.
- SSL: `verify=settings.SOAP_VERIFY_SSL` permite desabilitar verificação em ambientes de teste.

Exemplo de headers (padrão no projeto):

```
headers = {
    "Accept-Encoding": "gzip, deflate",
    "Content-Type": "text/xml;charset=UTF-8",
    "SOAPAction": '"http://www.totvs.com/IwsReport/GetReportInfo"',
    "Authorization": settings.AUTH_HARDCODED,
    "Content-Length": str(len(xml_text)),
    "Host": "bbsltda149898.rm.cloudtotvs.com.br:8051",
    "Connection": "Keep-Alive",
    "User-Agent": requests.utils.default_user_agent()
}
```

### Operações de wsReport usadas no projeto

1. GetReportInfo
   - Objetivo: recuperar metadados do relatório (parâmetros esperados, filtros, etc.).
   - Exemplo de envelope (simplificado):

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tot="http://www.totvs.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <tot:GetReportInfo>
      <tot:codColigada>1</tot:codColigada>
      <tot:idReport>10</tot:idReport>
    </tot:GetReportInfo>
  </soapenv:Body>
</soapenv:Envelope>
```

2. GetReportList
   - Objetivo: listar relatórios disponíveis (ex.: por `codColigada`).

3. GenerateReport (ou similar)
   - Objetivo: disparar a geração do relatório no servidor TOTVS. O projeto constrói um XML com parâmetros de relatório — ver `definer_params` em `generate_report.py`.
   - Observação: `definer_params` transforma pares chave/valor em elementos XML (parâmetros do relatório) conforme o formato esperado pelo wsReport.

4. GetGeneratedReportSize
   - Objetivo: obter o tamanho (em bytes) do relatório já gerado, usando o `guid` retornado pela geração.

5. GetFileChunk
   - Objetivo: recuperar um fragmento do arquivo gerado, recebendo `guid`, `offset` e `length`.
   - O projeto usa isso para baixar o relatório em pedaços (ideal para arquivos grandes).

### Exemplo mínimo em Python (padrão usado no projeto)

O padrão usado nas funções de `app/services` é algo como:

```python
from app.schemas.env_schema import settings
import requests

URL = settings.TOTVS_URL
AUTH = (settings.TOTVS_USERNAME, settings.TOTVS_PASSWORD)

xml_text = """
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tot="http://www.totvs.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <tot:GetReportInfo>
      <tot:codColigada>1</tot:codColigada>
      <tot:idReport>10</tot:idReport>
    </tot:GetReportInfo>
  </soapenv:Body>
</soapenv:Envelope>
"""

headers = {
    "Content-Type": "text/xml;charset=UTF-8",
    "SOAPAction": '"http://www.totvs.com/IwsReport/GetReportInfo"',
    "Authorization": settings.AUTH_HARDCODED,
}

resp = requests.post(URL, data=xml_text, headers=headers, auth=AUTH, verify=settings.SOAP_VERIFY_SSL)
resp.raise_for_status()

# Exemplo de parse com ElementTree
import xml.etree.ElementTree as ET
root = ET.fromstring(resp.content)
# navegar pelo XML para extrair o que for necessário
```

### Exemplo cURL (útil para debug)

```
curl -X POST \
  -H "Content-Type: text/xml;charset=UTF-8" \
  -H "SOAPAction: \"http://www.totvs.com/IwsReport/GetReportInfo\"" \
  -H "Authorization: Basic ..." \
  --data-binary @payload.xml \
  "https://seu-totvs:8051/wsReport/IwsReport"
```

Onde `payload.xml` contém o envelope SOAP (ex.: GetReportInfo mostrado acima).

### Observações e dicas de troubleshooting

- Header `Host`: em ambientes onde o host real do TOTVS difere do host lógico, ajuste o header `Host` (o projeto já inclui um `Host` em alguns pontos). Alguns proxies/serviços SOAP exigem esse header correto.
- `Content-Length`: o projeto costuma enviar `Content-Length` (len do XML). Normalmente `requests` faz isso automaticamente; usar manualmente é aceitável mas cuidado com encoding.
- `SOAPAction`: cada operação tem seu valor — ver `get_generated_report_size.py` e outros para exemplos concretos.
- SSL: se tiver erro de certificado em ambiente local, `SOAP_VERIFY_SSL=False` pode ser usado em `.env` para testes.
- Tamanho do arquivo: use `GetGeneratedReportSize` antes de baixar para definir o `length`/chunk size ao usar `GetFileChunk`.
- Erros no servidor TOTVS podem vir com stack traces dentro do envelope SOAP (ver `erros.txt` e `erros copy.xml` no projeto). Fazer log completo do `resp.content` ajuda a identificar o problema.

### Onde as rotas do FastAPI mapeiam para essas operações

- `POST /report/generate/{id_report}/{codColigada}` — aciona `generate_report` (gera relatório e retorna `guid`).
- `POST /report/chunk/` — endpoint para recuperar chuncks via `GetFileChunk`.
- `GET /report/metadata/{codColigada}/{idReport}` — chama `GetReportInfo` e retorna metadados para o frontend.

As rotas estão em `app/api/v1/routes/routers.py` e usam os serviços descritos acima.

---

Próximos passos (opções):

- adicionar este conteúdo ao `DOCUMENTAÇÃO.md` no root ou no `README` do frontend;
- incluir exemplos mais completos de parsing (por exemplo, extrair lista de parâmetros do `GetReportInfo` e mostrar como transformar em JSON para o frontend);
- gerar um script de teste local (`scripts/test_wsreport.py`) que faz uma chamada real contra `TOTVS_URL` usando `.env` do projeto (apenas se você autorizar criar/editar mais arquivos).

Fim da documentação específica sobre o uso do wsReport no projeto.

## Passo a passo: como usar um Web Service (wsReport) da TOTVS

Este passo a passo mostra, de forma prática e sequencial, como consumir o wsReport usado pelo projeto.

1. Pré-requisitos

- Ter Python 3.11+ instalado (o projeto usa Python 3.12/3.13 em Dockerfiles).
- Instalar dependências do backend (preferível em um virtualenv):

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -r backend/requirements.txt
```

- Ter as variáveis de ambiente configuradas no arquivo `backend/.env` (ou exportadas no ambiente). As principais usadas aqui são:
  - `TOTVS_URL` — URL do wsReport (ex.: https://host:8051/wsReport/IwsReport)
  - `TOTVS_USERNAME`, `TOTVS_PASSWORD` — credenciais HTTP Basic (usadas em `auth=(user, password)`)
  - `AUTH_HARDCODED` — header Authorization quando usado (ex.: Basic ...)
  - `SOAP_VERIFY_SSL` — True/False para verificação de certificado

2. Escolha a operação a executar

- GetReportInfo: obter metadados (parâmetros, filtros) do relatório
- GetReportList: listar relatórios disponíveis
- GenerateReport: solicitar geração do relatório (retorna um `guid`)
- GetGeneratedReportSize: verificar tamanho do relatório gerado (usando `guid`)
- GetFileChunk: baixar parte do arquivo (usa `guid`, `offset`, `length`)

3. Montar o envelope SOAP (XML)

- Cada operação tem um corpo XML específico no envelope SOAP. Exemplo mínimo para `GetReportInfo`:

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tot="http://www.totvs.com/">
  <soapenv:Header/>
  <soapenv:Body>
   <tot:GetReportInfo>
    <tot:codColigada>1</tot:codColigada>
    <tot:idReport>10</tot:idReport>
   </tot:GetReportInfo>
  </soapenv:Body>
</soapenv:Envelope>
```

4. Preparar headers e autenticação

- Headers típicos usados no projeto:

```python
headers = {
   "Accept-Encoding": "gzip, deflate",
   "Content-Type": "text/xml;charset=UTF-8",
   "SOAPAction": '"http://www.totvs.com/IwsReport/GetReportInfo"',
   "Authorization": settings.AUTH_HARDCODED,  # optional
}
AUTH = (settings.TOTVS_USERNAME, settings.TOTVS_PASSWORD)
```

- Observação: `requests.post` aceita tanto `auth=AUTH` (HTTP Basic) quanto headers manuais.

5. Fazer a requisição (exemplo em Python)

```python
from app.schemas.env_schema import settings
import requests
import xml.etree.ElementTree as ET

URL = settings.TOTVS_URL
AUTH = (settings.TOTVS_USERNAME, settings.TOTVS_PASSWORD)

xml_text = """(coloque aqui o envelope SOAP)"""
headers = {
   "Content-Type": "text/xml;charset=UTF-8",
   "SOAPAction": '"http://www.totvs.com/IwsReport/GetReportInfo"',
}

resp = requests.post(URL, data=xml_text, headers=headers, auth=AUTH, verify=settings.SOAP_VERIFY_SSL)
resp.raise_for_status()

# Parse básico
root = ET.fromstring(resp.content)
```

6. Exemplo rápido em cURL (útil para replicar / debug)

```powershell
curl -X POST -H "Content-Type: text/xml;charset=UTF-8" -H "SOAPAction: \"http://www.totvs.com/IwsReport/GetReportInfo\"" -H "Authorization: Basic ..." --data-binary @payload.xml "https://seu-totvs:8051/wsReport/IwsReport"
```

7. Obter o `guid` após gerar relatório e baixar em chunks

- Fluxo recomendado:
  1. Chamar `GenerateReport` (ou endpoint/serviço equivalente) e receber `guid`.
  2. Chamar `GetGeneratedReportSize` com o `guid` para saber o tamanho total.
  3. Repetir chamadas `GetFileChunk` definindo `offset` e `length` para baixar em pedaços (por exemplo, 1 MiB por chunk) até completar.

8. Parsing das respostas SOAP

- As respostas geralmente vêm dentro de um envelope XML; use `xml.etree.ElementTree` ou `lxml` para navegar.
- Verifique espaços de nomes (namespaces) ao procurar elementos (`root.findall('.//{http://www.totvs.com/}GetReportInfoResult')`).

9. Boas práticas e troubleshooting

- Verifique o conteúdo completo de `resp.content` quando algo falhar — o servidor SOAP pode retornar stack traces dentro do envelope (ver `erros.txt`).
- Ajuste o header `Host` se o servidor exigir um host virtual específico (o projeto às vezes define `Host` manualmente).
- Em ambientes de homologação com certificado inválido, `SOAP_VERIFY_SSL=False` facilita o teste (não usar em produção).
- Prefira enviar `Content-Length` manualmente apenas se realmente necessário; `requests` trata disso automaticamente.
- Evite timeouts infinitos — use `requests.post(..., timeout=(connect, read))` para evitar bloqueios.

10. Testando localmente com o projeto

- Suba o backend usando Docker Compose (arquivo `docker-compose.yaml` no root). O serviço `api` usa `backend/Dockerfile`.
- Alternativamente, execute localmente via `uvicorn app.main:app --reload --port 8000` dentro do ambiente virtual.
- Use as rotas FastAPI expostas (ex.: `POST /report/generate/{id_report}/{codColigada}`) para testar as integrações já implementadas.

Se quiser, eu crio um script de teste automatizado em `backend/scripts/test_wsreport.py` que:

- carrega as variáveis de `backend/.env`;
- executa `GetReportInfo` e imprime os parâmetros esperados em JSON;
- (opcional) executa `GenerateReport` e tenta baixar o arquivo em chunks.

Diga se quer que eu adicione esse script e eu o crio com exemplos executáveis.
