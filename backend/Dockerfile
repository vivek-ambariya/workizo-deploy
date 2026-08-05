FROM python:3.11-slim

# Prevent Python from writing bytecode and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies needed for OpenCV and Postgres/PyMySQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy application backend code
COPY . /app/

# Collect static files directory
RUN mkdir -p /app/staticfiles /app/media

EXPOSE 8000

# Default command runs Daphne ASGI server for HTTP & WebSockets
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "config.asgi:application"]
