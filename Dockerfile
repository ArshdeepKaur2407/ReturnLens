FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code and pre-trained models
COPY config.py .
COPY src/ ./src/
COPY models/ ./models/
COPY reports/ ./reports/
COPY client/dist/ ./client/dist/
COPY api/ ./api/

# Environment configuration
ENV PORT=5050
ENV PYTHONUNBUFFERED=1

EXPOSE 5050

# Launch unified web application & REST API
CMD ["sh", "-c", "uvicorn api.main:app --host 0.0.0.0 --port ${PORT}"]
