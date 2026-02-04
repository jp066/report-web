from fastapi import APIRouter

reportRouter = APIRouter(
    prefix="/report",
    tags=["report"], # a tag é usada para agrupar endpoints na documentação
)



authRouter = APIRouter(
    prefix="/auth",
    tags=["auth"], # a tag é usada para agrupar endpoints na documentação
)