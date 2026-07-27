"""
Custom FastAPI middleware for request tracking and logging.
"""

import time
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from loguru import logger

class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Middleware that assigns a unique Request ID to each incoming request
    and attaches it to the response headers as X-Request-ID.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id
        
        response: Response = await call_next(request)
        
        response.headers["X-Request-ID"] = request_id
        return response

class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that logs execution details of all API requests,
    including status codes, endpoints, and processing times.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.perf_counter()
        
        request_id = getattr(request.state, "request_id", "N/A")
        client_ip = request.client.host if request.client else "unknown"
        method = request.method
        path = request.url.path
        
        logger.info(
            f"Incoming request: {method} {path} | IP: {client_ip} | RequestID: {request_id}"
        )
        
        try:
            response: Response = await call_next(request)
            process_time = (time.perf_counter() - start_time) * 1000
            
            logger.info(
                f"Completed response: {method} {path} | Status: {response.status_code} | "
                f"Duration: {process_time:.2f}ms | RequestID: {request_id}"
            )
            return response
        except Exception as e:
            process_time = (time.perf_counter() - start_time) * 1000
            logger.error(
                f"Failed request: {method} {path} | Error: {str(e)} | "
                f"Duration: {process_time:.2f}ms | RequestID: {request_id}"
            )
            raise e
