import inspect
import logging
import os
import time
import uuid
from datetime import datetime
from typing import Dict, Any
from fastapi import Request, Response
from contextvars import ContextVar
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import get_settings

settings = get_settings()

# Context variable to store correlation ID for the current request
correlation_id_var: ContextVar[str] = ContextVar('correlation_id', default=None)


class CustomLogger:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super().__new__(cls)
            cls._instance._initialize(*args, **kwargs)
        return cls._instance

    def _initialize(self, log_dir="logs"):
        self.log_dir = log_dir
        self._create_log_directory()
        self.logger = self._create_logger()
        
        # Sensitive headers to filter out
        self.sensitive_headers = {
            'authorization', 'x-api-key', 'x-auth-token', 'cookie',
            'x-access-token', 'x-refresh-token', 'bearer'
        }
        
        # Request start times for tracking latency
        self.request_start_times: Dict[str, float] = {}

    def _create_log_directory(self):
        os.makedirs(self.log_dir, exist_ok=True)

    def _create_logger(self):
        logger = logging.getLogger(__name__)
        logger.setLevel(logging.INFO)

        formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - [%(service_name)s:%(service_version)s] - [%(environment)s] - %(message)s'
        )

        # Create a file handler
        filename = os.path.join(self.log_dir, f"log_{datetime.now().strftime('%Y-%m-%d')}.log")
        file_handler = logging.FileHandler(filename)
        file_handler.setLevel(logging.INFO)
        file_handler.setFormatter(formatter)

        # Create a console handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_handler.setFormatter(formatter)

        # Add handlers to the logger
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)

        return logger

    def _get_method_name(self):
        try:
            return inspect.getouterframes(inspect.currentframe())[2].function
        except Exception:
            return "unknown"

    def _get_correlation_id(self) -> str:
        """Get or generate correlation ID for the current request"""
        correlation_id = correlation_id_var.get()
        if not correlation_id:
            correlation_id = str(uuid.uuid4())
            correlation_id_var.set(correlation_id)
        return correlation_id

    def _filter_sensitive_headers(self, headers: Dict[str, str]) -> Dict[str, str]:
        """Filter out sensitive headers like authorization tokens"""
        if not headers:
            return {}
        
        return {key: "[FILTERED]" if key.lower() in self.sensitive_headers else value for key, value in headers.items()}

    def _get_safe_body_info(self, body_text: Any) -> str:
        """Get safe representation of body without sensitive data"""
        if not body_text:
            return "No body"
        
        if isinstance(body_text, dict):
            # Filter out potential sensitive fields
            sensitive_fields = {'password', 'token', 'secret', 'key', 'authorization'}
            safe_body = {key: "[FILTERED]" if any(sensitive in key.lower() for sensitive in sensitive_fields) else value for key, value in body_text.items()}
            return str(safe_body)
        
        # For string body, just return length info if it's too long
        if isinstance(body_text, str) and len(body_text) > 500:
            return f"Body too large (size: {len(body_text)} chars)"
        
        return str(body_text)

    def _format_user_info(self, user_info: Any) -> str:
        """Format user information for logging"""
        if not user_info:
            return "No user info"
        
        if isinstance(user_info, dict):
            user_id = (
                      user_info.get('username') or 
                      user_info.get('admin_username') or  # For school admins
                      user_info.get('email') or
                      'Unknown')
            
            user_type = (user_info.get('user_type') or 
                         user_info.get('role') or 
                         user_info.get('type') or 
                         'Unknown')
            
            formatted_info = f"UserName:{user_id}, UserType:{user_type}"
            
            school_id = user_info.get('school_id')
            if school_id:
                formatted_info += f", SchoolID:{school_id}"
            
            school_name = user_info.get('school_name')
            if school_name:
                formatted_info += f", School:{school_name}"
            
            session_id = user_info.get('session_id')
            if session_id:
                formatted_info += f", Session:{session_id}"
            
            status = user_info.get('status')
            if status:
                formatted_info += f", Status:{status}"
            
            return formatted_info
        
        return str(user_info)

    def _get_user_info(self, request: Request = None) -> str:
        """Extract user information from request"""
        if not request:
            return "No request context"
        
        user_details = getattr(request.state, 'user_details', None)
        if user_details:
            return self._format_user_info(user_details)
        
        return "Not a logged in user"

    def _log_with_context(self, level: str, message: str, request: Request = None, **kwargs):
        """Internal method to log with service context"""
        correlation_id = self._get_correlation_id()
        
        extra = {
            'service_name': settings.SERVICE_NAME,
            'service_version': settings.SERVICE_VERSION,
            'environment': settings.ENVIRONMENT,
            'correlation_id': correlation_id
        }
        
        formatted_message = f"[CorrelationID:{correlation_id}] | - {message}"
        
        getattr(self.logger, level.lower())(formatted_message, extra=extra, **kwargs)

    async def start_request_tracking(self, request: Request):
        correlation_id = str(uuid.uuid4())
        correlation_id_var.set(correlation_id)
        
        start_time = time.time()
        self.request_start_times[correlation_id] = start_time
        
        api_path = request.url.path
        http_method = request.method
        
        headers = self._filter_sensitive_headers(dict(request.headers))
        
        body_info = "No body"
        if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
            content_type = request.headers.get("content-type", "").lower()
            if "multipart/form-data" in content_type or "application/x-www-form-urlencoded" in content_type:
                body_info = "Form Data"
            elif "application/json" in content_type:
                try:
                    body = await request.body()
                    body_text = body.decode("utf-8") if body else None
                    body_info = self._get_safe_body_info(body_text)
                except Exception:
                    body_info = "Unable to read JSON body"
            else:
                try:
                    body = await request.body()
                    body_text = body.decode("utf-8") if body else None
                    body_info = self._get_safe_body_info(body_text)
                except Exception:
                    body_info = "Unable to read body"
        
        self._log_with_context(
            'info',
            f"REQUEST_START - API:{api_path} | HTTP_METHOD:{http_method} | HEADERS:{headers} | BODY:{body_info}",
            request
        )
        
        return correlation_id

    def log_response(self, request: Request, response: Response, step: str = "RESPONSE", user_info: dict = None):
        correlation_id = self._get_correlation_id()
        
        start_time = self.request_start_times.get(correlation_id)
        response_time = None
        if start_time:
            response_time = round((time.time() - start_time) * 1000, 2)
            del self.request_start_times[correlation_id]
        
        status_code = response.status_code
        
        response_size = "Unknown"
        if hasattr(response, 'headers') and 'content-length' in response.headers:
            response_size = response.headers['content-length']
        
        if status_code >= 500:
            log_level = 'error'
            message_type = "ERROR_RESPONSE"
        elif status_code >= 400:
            log_level = 'warning'
            message_type = "WARNING_RESPONSE"
        else:
            log_level = 'info'
            message_type = "SUCCESS_RESPONSE"
        
        api_path = request.url.path
        
        if user_info is not None:
            formatted_user_info = self._format_user_info(user_info)
        else:
            formatted_user_info = self._get_user_info(request)
        
        message = f"REQUEST_COMPLETED | {message_type} - API:{api_path} | USER:{formatted_user_info} | STATUS_CODE:{status_code} "
        if response_time:
            message += f" | RESPONSE_TIME:{response_time}ms"
        message += f" | RESPONSE_SIZE:{response_size}"
        
        self._log_with_context(log_level, message, request)

    def log_step(self, step_name: str, message: str = "", start_time: float = None, request: Request = None):
        method_name = self._get_method_name()
        if request:
            api_path = request.url.path
            log_message = f"STEP - {step_name} | API:{api_path} | METHOD:{method_name}"
        else:
            log_message = f"STEP - {step_name} | API: 'NONE'  METHOD:{method_name}"
        
        if start_time:
            step_time = round((time.time() - start_time) * 1000, 2)
            log_message += f" | DURATION:{step_time}ms"
        
        if message:
            log_message += f" | MESSAGE:{message}"
        
        self._log_with_context('info', log_message, request)

    def log_message_sync(self, message: str = "", request: Request = None):
        method_name = self._get_method_name()
        if request:
            api_path = request.url.path
            log_message = f"INFO - API:{api_path} | METHOD:{method_name}"
        else:
            log_message = f"INFO - METHOD:{method_name}"
        if message:
            log_message += f" | MESSAGE:{message}"
        self._log_with_context('info', log_message, request)

    def log_warning_sync(self, message: str = "", request: Request = None):
        method_name = self._get_method_name()
        if request:
            api_path = request.url.path
            log_message = f"WARNING - API:{api_path} | METHOD:{method_name}"
        else:
            log_message = f"WARNING - METHOD:{method_name}"
        if message:
            log_message += f" | MESSAGE:{message}"
        self._log_with_context('warning', log_message, request)

    def log_error_sync(self, message: str = "", exc_info: bool = True, request: Request = None):
        method_name = self._get_method_name()
        if request:
            api_path = request.url.path
            log_message = f"ERROR - API:{api_path} | METHOD:{method_name}"
        else:
            log_message = f"ERROR - METHOD:{method_name}"
        if message:
            log_message += f" | MESSAGE:{message}"
        self._log_with_context('error', log_message, request, exc_info=exc_info)

    async def log_message(self, request: Request = None, message: str = "", step: str = "INFO", user_info: dict = None):
        try:
            if user_info is not None:
                formatted_user_info = self._format_user_info(user_info)
            else:
                formatted_user_info = "Unknown"
        except Exception:
            formatted_user_info = "Unknown"

        method_name = self._get_method_name()
        if request:
            api_path = request.url.path
            if formatted_user_info == "Unknown":
                formatted_user_info = self._get_user_info(request)
            log_message = f"- API:{api_path} | USER:{formatted_user_info}| {step} - METHOD:{method_name}  | MESSAGE:{message}"
        else:
            log_message = f"- API: 'NONE' | USER: {formatted_user_info} | {step} - METHOD:{method_name} | MESSAGE:{message}"
        
        self._log_with_context('info', log_message, request)

    async def log_warning(self, request: Request = None, message: str = "", step: str = "WARNING", user_info: dict = None):
        try:
            if user_info is not None:
                formatted_user_info = self._format_user_info(user_info)
            else:
                formatted_user_info = "Unknown"
        except Exception:
            formatted_user_info = "Unknown"

        method_name = self._get_method_name()
        if request:
            api_path = request.url.path
            if formatted_user_info == "Unknown":
                formatted_user_info = self._get_user_info(request)
            log_message = f"- API:{api_path} | USER:{formatted_user_info} |{step} - METHOD:{method_name} | MESSAGE:{message}"
        else:
            log_message = f"- API: 'NONE' | USER: {formatted_user_info} | {step} - METHOD:{method_name} | MESSAGE:{message}"
        
        self._log_with_context('warning', log_message, request)

    async def log_error(self, request: Request = None, message: str = "", step: str = "ERROR", exc_info: bool = True, user_info: dict = None):
        try:
            if user_info is not None:
                formatted_user_info = self._format_user_info(user_info)
            else:
                formatted_user_info = "Unknown"
        except Exception:
            formatted_user_info = "Unknown"

        method_name = self._get_method_name()
        if request:
            api_path = request.url.path
            if formatted_user_info == "Unknown":
                formatted_user_info = self._get_user_info(request)
            log_message = f"- API:{api_path} | USER:{formatted_user_info} | {step} - METHOD:{method_name} | MESSAGE:{message}"
        else:  
            log_message = f"- API: 'NONE' | USER: {formatted_user_info} | {step} - METHOD:{method_name} | MESSAGE:{message}"
        
        self._log_with_context('error', log_message, request, exc_info=exc_info)

    def time_operation(self, operation_name: str, user_info: dict = None, request: Request = None):
        return TimedOperation(self, operation_name, user_info, request)


class TimedOperation:
    def __init__(self, logger_instance: CustomLogger, operation_name: str, user_info: dict = None, request: Request = None):
        self.logger = logger_instance
        self.operation_name = operation_name
        self.start_time = None
        self.user_info = user_info
        self.request = request
        
    def __enter__(self):
        self.start_time = time.time()
        self.logger.log_step(f"{self.operation_name}_START", request=self.request)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = round((time.time() - self.start_time) * 1000, 2)
        if exc_type:
            self.logger.log_error_sync(f"{self.operation_name}_FAILED - Duration:{duration}ms | Error:{str(exc_val)}", request=self.request)
        else:
            self.logger.log_step(f"{self.operation_name}_COMPLETE", f"Duration:{duration}ms", request=self.request)


class LoggingMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, logger_instance: CustomLogger = None):
        super().__init__(app)
        self.logger = logger_instance or logger
    
    async def dispatch(self, request: Request, call_next):
        correlation_id = await self.logger.start_request_tracking(request)
        request.state.correlation_id = correlation_id
        
        try:
            response = await call_next(request)
            self.logger.log_response(request, response)
            return response
        except Exception as e:
            await self.logger.log_error(request, f"Unhandled exception in request processing: {str(e)}", "UNHANDLED_EXCEPTION")
            raise


logger = CustomLogger()
