import base64
import logging
from fastapi import Depends, HTTPException, Response, Query, Body
from app.dependecy.authVerify import get_current_user
from . import reportRouter, authRouter
from app.services.generate_report import generate_report
from app.services.get_all_reports import report_list, formatted_report_list
from app.services.get_generated_report_size import get_file_size
from app.services.get_report_file_chunk import get_file_chunk
from app.schemas.report_schema import Report, ExportPdfRequest
from app.schemas.login_schema import UsuarioDb


@reportRouter.post("/generate/{id_report}")
async def generate_report_endpoint(id_report: int, response_model=Report, current_user: UsuarioDb = Depends(get_current_user)):
    logger = logging.getLogger("uvicorn.error")
    logger.info(
        f"Gerando relatório - ID: {id_report}, Usuário: {current_user.email}")
    try:
        guid = generate_report(id_report=id_report)
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