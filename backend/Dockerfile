FROM python:3.11-slim

# Prevents Python from writing .pyc files and ensures output is flushed
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps for building some Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies first for better layer caching
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy source code
COPY . /app

# Expose FastAPI port
EXPOSE 8001

# Default envs (can be overridden by compose)
ENV HOST=0.0.0.0 \
    PORT=8001

# Run the FastAPI app
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]


