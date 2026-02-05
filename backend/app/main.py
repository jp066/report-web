from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.routes.routers import reportRouter
from app.api.v1.routes.auth import authRouter

from app.core.cors import setup_cors

app = FastAPI()

setup_cors(app)

app.include_router(reportRouter)
app.include_router(authRouter)