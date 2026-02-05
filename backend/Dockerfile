FROM python:3.12
WORKDIR /backend
COPY ./requirements.txt /backend/requirements.txt
RUN apt-get update && \
    apt-get install -y gcc g++ gnupg2 curl unixodbc-dev unixodbc && \
    curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /usr/share/keyrings/microsoft-prod.gpg && \
    echo "deb [arch=amd64,arm64,armhf signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" > /etc/apt/sources.list.d/mssql-release.list && \
    apt-get update && \
    ACCEPT_EULA=Y apt-get install -y msodbcsql17 && \
    rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir --upgrade -r /backend/requirements.txt
COPY ./app /backend/app
COPY .env /backend/.env
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]