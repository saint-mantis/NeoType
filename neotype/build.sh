#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --no-input

# Create cache table
python manage.py createcachetable

# Run database migrations
python manage.py migrate

# Populate sample text content
python manage.py populate_texts