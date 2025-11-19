from fastapi import HTTPException
from . import reportRouter
from app.services.generate_report import generate_report
from app.services.get_all_reports import report_list
from app.services.get_generated_report_size import get_file_size
from app.services.get_report_file_chunk import get_file_chunk
from app.schemas.report_schema import Report


@reportRouter.post("/generate/{id_report}")
async def generate_report_endpoint(id_report: int, response_model=Report):
    try:
        guid = generate_report(id_report=id_report)
        file_size = get_file_size(guid)
        return {"guid": guid, "file_size": file_size}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

#@reportRouter.post("/chunk/{guid}/{size_file}")
@reportRouter.post("/chunk/")
async def get_file_chunk_endpoint(guid: str, size: int):
    try:
        chunk_data = get_file_chunk(guid, size)
        if "Fault" in chunk_data:
            raise HTTPException(status_code=500, detail="Erro no serviço SOAP: Licença excedida")
        return {"chunk_data": chunk_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@reportRouter.get("")
async def get_available_reports():
    list_report = report_list()
    return list_report