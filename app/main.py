from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.routes import reportRouter
from app.core.cors import setup_cors

app = FastAPI()


setup_cors(app)

app.include_router(reportRouter)