from pydantic import BaseModel

class Report(BaseModel):
    guid: str
    file_size: int