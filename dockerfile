# Use an official lightweight Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy dependency file first
COPY requirements.txt requirements.txt

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy all files into container
COPY . .


# Run the Flask app
CMD ["/bin/bash","docker-entrypoint.sh"]

