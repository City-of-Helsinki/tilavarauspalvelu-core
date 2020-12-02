#!/bin/bash

# Run black formatting
python -m black --config black.toml .

# Sort imports
python -m isort .

# Check pep8 errors with flake
python -m flake8