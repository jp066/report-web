# report-web

Projeto FastAPI gerado com fastinit.

# Documentação — **report-web**

## Visão Geral

Projeto **FastAPI** interno da empresa em que trabalho para geração e recuperação de relatórios via serviços **SOAP (IwsReport)**. Implementa endpoints para:

* Gerar relatório (`GenerateReport`)
* Obter tamanho do relatório (`GetGeneratedReportSize`)
* Ler chunks de arquivo gerado (`GetFileChunk`)
* Listar relatórios (stub por enquanto)

## Estrutura do Projeto

```
app/
  main.py — instancia FastAPI e registra router /report
  api/v1/routes/reports_routers.py — rotas HTTP

services/
  generate_report.py — chama SOAP GenerateReport -> retorna GUID
  get_generated_report_size.py — chama SOAP GetGeneratedReportSize -> retorna tamanho
  get_report_file_chunk.py — chama SOAP GetFileChunk -> retorna chunk
  get_all_reports.py — stub para lista de relatórios
  report_schema.py — Pydantic: Report(guid: str, file_size: int)

report_list.json — exemplo de lista de guids
core/config.py — configurações
```

## Endpoints

### POST /report/generate/{id_report}

* **Parâmetro:** `id_report` (int)
* **Descrição:** Gera relatório e retorna `guid` e `file_size`.
* **Resposta:**

```json
{
  "guid": "9889c2d5-0887-4b2f-bba0-2aacaba36931",
  "file_size": 123456
}
```

### POST /report/get_file_chunk/{guid}/{size_file}

* **Parâmetros:** `guid` (str), `size_file` (int)
* **Descrição:** Obtém chunk do arquivo do relatório.
* **Resposta:**

```json
{
  "chunk_data": "<dados base64 ou texto>"
}
```

### GET /report

* **Descrição:** Retorna lista de relatórios disponíveis (stub).

## Serviços SOAP

* **URL:** `https://bbsltda149898.rm.cloudtotvs.com.br:8051/wsReport/IwsReport`
* Credenciais hardcoded em `services/*`.
* `verify=False` desabilita verificação TLS.
* Há prints de depuração.

## Instalação / Execução
### Futuramente será contêinerizado com Docker.

### Criar virtualenv (Windows PowerShell)

```
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Rodar servidor

```
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Exemplos (curl)

### Gerar relatório

```
curl -X POST "http://localhost:8000/report/generate/123" -H "Content-Type: application/json"
```

### Obter chunk

```
curl -X POST "http://localhost:8000/report/get_file_chunk/9889c2d5-.../1024"
```
