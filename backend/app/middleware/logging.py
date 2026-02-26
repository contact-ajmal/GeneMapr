"""
Logging middleware for FastAPI.

Provides structured request/response logging with timing information.
"""
import logging
import time
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

# Configure logger
logger = logging.getLogger("genemapr")


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that logs all HTTP requests and responses.

    Logs include:
    - Request method, path, query params
    - Client IP address
    - Response status code
    - Request processing time
    - Error details (if any)
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and log details."""
        # Start timer
        start_time = time.time()

        # Get request details
        method = request.method
        path = request.url.path
        query_params = dict(request.query_params)
        client_ip = request.client.host if request.client else "unknown"

        # Log incoming request
        logger.info(
            f"Incoming request: {method} {path}",
            extra={
                "method": method,
                "path": path,
                "query_params": query_params,
                "client_ip": client_ip,
            }
        )

        # Process request
        try:
            response = await call_next(request)

            # Calculate processing time
            process_time = time.time() - start_time

            # Log response
            logger.info(
                f"Request completed: {method} {path} - {response.status_code}",
                extra={
                    "method": method,
                    "path": path,
                    "status_code": response.status_code,
                    "process_time": f"{process_time:.3f}s",
                    "client_ip": client_ip,
                }
            )

            # Add processing time to response headers
            response.headers["X-Process-Time"] = f"{process_time:.3f}"

            return response

        except Exception as e:
            # Calculate processing time
            process_time = time.time() - start_time

            # Log error
            logger.error(
                f"Request failed: {method} {path} - {str(e)}",
                extra={
                    "method": method,
                    "path": path,
                    "error": str(e),
                    "error_type": type(e).__name__,
                    "process_time": f"{process_time:.3f}s",
                    "client_ip": client_ip,
                },
                exc_info=True
            )

            # Re-raise the exception to be handled by FastAPI
            raise


def configure_logging(log_level: str = "INFO") -> None:
    """
    Configure application logging.

    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    """
    # Create logger
    logger = logging.getLogger("genemapr")
    logger.setLevel(getattr(logging, log_level.upper()))

    # Create console handler with formatting
    handler = logging.StreamHandler()
    handler.setLevel(getattr(logging, log_level.upper()))

    # Create formatter
    formatter = logging.Formatter(
        fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    handler.setFormatter(formatter)

    # Add handler to logger
    logger.addHandler(handler)

    # Prevent duplicate logs
    logger.propagate = False

    logger.info(f"Logging configured with level: {log_level}")
