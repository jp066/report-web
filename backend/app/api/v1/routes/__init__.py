from fastapi import APIRouter

reportRouter = APIRouter(
    prefix="/report",
    tags=["report"],
)



authRouter = APIRouter(
    prefix="/auth",
    tags=["auth"],
)