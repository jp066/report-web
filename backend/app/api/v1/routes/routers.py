import base64
import logging
from typing import List, Dict
from fastapi import Depends, HTTPException, Response, Query, Body
from pydantic import BaseModel
from app.dependecy.authVerify import get_current_user
from app.services.get_metadata_reports import metadata_report
from . import reportRouter, authRouter
from app.services.generate_report import generate_report
from app.services.get_all_reports import report_list, formatted_report_list
from app.services.get_generated_report_size import get_file_size
from app.services.get_report_file_chunk import get_file_chunk
from app.schemas.report_schema import Report, ExportPdfRequest
from app.schemas.login_schema import UsuarioDb


@reportRouter.post("/generate/{id_report}/{codColigada}")
async def generate_report_endpoint(id_report: int, codColigada: int, parameters: dict = Body(default={}), current_user: UsuarioDb = Depends(get_current_user)):
    logger = logging.getLogger("uvicorn.error")
    logger.info(
        f"Gerando relatório - ID: {id_report}, Usuário: {current_user.email}")
    try:
        logger.info(
            "Parâmetros recebidos no endpoint /generate: %s", parameters)
        # passa parâmetros opcionais para a função de geração
        guid = generate_report(id_report=id_report,
                               codColigada=codColigada, **parameters)
        file_size = get_file_size(guid)
        logger.info(
            f"Relatório gerado com sucesso - GUID: {guid}, Tamanho: {file_size}")
        return {"guid": guid, "file_size": file_size}
    except Exception as e:
        logger.error(f"Erro ao gerar relatório ID {id_report}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@reportRouter.post("/chunk/")
async def get_file_chunk_endpoint(guid: str, size: int, current_user: UsuarioDb = Depends(get_current_user)):
    try:
        chunk_data = get_file_chunk(guid, size)

        if chunk_data is None:
            raise HTTPException(
                status_code=404, detail="Chunk não encontrado na resposta SOAP")

        if "Fault" in chunk_data:
            raise HTTPException(
                status_code=500, detail="Erro no serviço SOAP: Licença excedida")

        return {"chunk_data": chunk_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@reportRouter.post("/export")
def get_pdf(request: ExportPdfRequest = Body(...), current_user: UsuarioDb = Depends(get_current_user)):
    b64 = request.b64
    pdf_b64 = base64.b64decode(b64)
    return Response(
        content=pdf_b64,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=report.pdf"
        }
    )


@reportRouter.get("")
def get_available_reports(current_user: UsuarioDb = Depends(get_current_user)):
    try:
        list_report = report_list()
        return list_report
    except RuntimeError as e:
        error_msg = str(e)
        if "licença" in error_msg.lower() or "license" in error_msg.lower():
            raise HTTPException(
                status_code=503,
                detail="Serviço temporariamente indisponível: TOTVS sem licenças disponíveis"
            )
        raise HTTPException(status_code=500, detail=error_msg)


class MetadataResponse(BaseModel):
    filtros_disponiveis: Dict[str, List[str]]
    parametros_requeridos: List[str]


@reportRouter.get("/metadata/{codColigada}/{idReport}", response_model=MetadataResponse)
def get_report_metadata(codColigada: int, idReport: int, current_user: UsuarioDb = Depends(get_current_user)):
    try:
        metadata_xml = metadata_report(codColigada, idReport)
        # namespace usado pelo RM nos metadados
        ns = {"r": "http://www.totvs.com.br/RM/"}

        # extrai parâmetros (nomes)
        param_elems = metadata_xml.findall(".//r:RptParameterReportPar", ns)
        parametros_requeridos = [
            p.find("r:ParamName", ns).text
            for p in param_elems
            if p.find("r:ParamName", ns) is not None
        ]

        # extrai filtros por tabela (se houver)
        filtros = {}
        filter_elems = metadata_xml.findall(".//r:RptFilterByTablePar", ns)
        for fe in filter_elems:
            table = fe.find("r:TableName", ns)
            filt = fe.find("r:Filter", ns)
            if table is not None and filt is not None:
                filtros.setdefault(table.text, []).append(filt.text or "")

        return {"filtros_disponiveis": filtros, "parametros_requeridos": parametros_requeridos}
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger = logging.getLogger("uvicorn.error")
        logger.exception("Erro ao obter metadados do relatório")
        raise HTTPException(
            status_code=500, detail="Erro interno ao obter metadados")
