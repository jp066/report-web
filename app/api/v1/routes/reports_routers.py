from fastapi import HTTPException
from . import reportRouter
from services.generate_report import generate_report
from services.get_all_reports import report_list
from services.get_generated_report_size import get_file_size
from services.get_report_file_chunk import get_file_chunk
from schemas.report_schema import Report


@reportRouter.post("/generate/{id_report}")
async def generate_report_endpoint(id_report: int, response_model=Report):
    try:
        guid = generate_report(id_report=id_report)
        file_size = get_file_size(guid)
        return {"guid": guid, "file_size": file_size}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@reportRouter.post("/get_file_chunk/{guid}/{size_file}")
async def get_file_chunk_endpoint(guid: str, size_file: int):
    try:
        chunk_data = get_file_chunk(guid, size_file)
        return {"chunk_data": chunk_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@reportRouter.get("")
async def get_available_reports():
    list_report = report_list() 
    return {list_report}