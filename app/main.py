from fastapi import FastAPI
from api.v1.routes import reportRouter

app = FastAPI()
app.include_router(reportRouter)