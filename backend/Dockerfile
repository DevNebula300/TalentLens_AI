FROM python:3.12-slim

WORKDIR /app

# Install system dependencies needed for compiling some python packages (e.g., psycopg2, pgvector, etc)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install CPU-only torch first (default Linux wheel pulls multi-GB CUDA deps)
RUN grep -v '^torch==' requirements.txt > /tmp/requirements-no-torch.txt \
    && pip install --no-cache-dir torch==2.13.0 --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r /tmp/requirements-no-torch.txt

# Download spaCy model
RUN python -m spacy download en_core_web_sm

COPY . .

# Ensure the uploads directory exists just in case any legacy code depends on it
RUN mkdir -p uploads/resumes

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
