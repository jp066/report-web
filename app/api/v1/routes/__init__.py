from fastapi import APIRouter

reportRouter = APIRouter(
    prefix="/report",
    tags=["report"], # a tag é usada para agrupar endpoints na documentação
)

from . import reports_routers  # isso garante que os endpoints sejam registrados