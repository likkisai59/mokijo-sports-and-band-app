"""
Structured logging system configuration utilizing loguru.
Intercepts standard logging library calls and formats them.
"""

import sys
import logging
from loguru import logger
from app.core.config import settings

class InterceptHandler(logging.Handler):
    """
    Default handler from standard logging to intercept and route to Loguru.
    """
    def emit(self, record):
        # Get corresponding Loguru level if it exists
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        # Find caller from where originated the logged message
        frame, depth = logging.currentframe(), 2
        while frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())


def setup_logging():
    """
    Initializes structured logging configuration.
    Configures log levels, standard handlers, formats, and file outputs if in production.
    """
    # Remove default loguru handler
    logger.remove()

    # Log format layout configuration
    log_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
        "<level>{message}</level>"
    )

    # 1. Console Handler
    logger.add(
        sys.stdout,
        format=log_format,
        level="INFO" if settings.is_production else "DEBUG",
        backtrace=not settings.is_production,
        diagnose=not settings.is_production,
    )

    # 2. File Handler (Optional in Production)
    if settings.is_production:
        logger.add(
            "logs/app.log",
            rotation="10 MB",
            retention="30 days",
            format=log_format,
            level="WARNING",
            compression="zip"
        )

    # Intercept system loggers
    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)
    
    # Force interception for uvicorn loggers
    for logger_name in ("uvicorn", "uvicorn.error", "uvicorn.access", "sqlalchemy.engine"):
        logging_logger = logging.getLogger(logger_name)
        logging_logger.handlers = [InterceptHandler()]
        logging_logger.propagate = False

    logger.info("Logging infrastructure successfully initialized.")
