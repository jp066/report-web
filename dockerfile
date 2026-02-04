FROM python:3.13.7
WORKDIR /backend
COPY ./requirements.txt /backend/requirements.txt
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir --upgrade -r /backend/requirements.txt
COPY ./app /backend/app
COPY .env /backend/.env
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]