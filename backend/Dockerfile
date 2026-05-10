FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir psycopg2-binary gunicorn PyJWT passlib bcrypt==3.2.2 httpx google-auth requests beautifulsoup4 python-multipart

COPY . .

CMD python -c "from database import engine; import models; models.Base.metadata.create_all(bind=engine)" && uvicorn main:app --host 0.0.0.0 --port 8000
