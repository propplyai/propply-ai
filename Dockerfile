# Use Python 3.11 as base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire application
COPY . .

# Expose port
EXPOSE $PORT

# Start the Flask application
CMD gunicorn propply_app:app --bind 0.0.0.0:$PORT --workers 4 --timeout 120
