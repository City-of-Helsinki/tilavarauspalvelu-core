import logging


def getLogger(name: str) -> logging.Logger:
    """Returns a new logger with tilavaraus prefix in the name"""
    return logging.getLogger(f"tilavaraus.{name}")
