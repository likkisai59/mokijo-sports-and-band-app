"""
exceptions.py — Custom application exceptions for MUKIJO.
"""

class SessionNotFoundError(Exception):
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.message = f"Session '{session_id}' not found."
        super().__init__(self.message)


class ResourceNotFoundError(Exception):
    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class ResourceConflictError(Exception):
    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class InvalidValueError(Exception):
    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)
