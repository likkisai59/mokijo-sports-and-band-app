from fastapi import APIRouter
from app.connectors.postgresql import PostgreSQLConnector
from app.connectors.storage import CloudStorage


class ConnectionService:
    """Base class for database, storage and router instances"""
    
    def __init__(self) -> None:
        self.router = APIRouter()
        self.storage_instance = CloudStorage()
        self.cf_storage_instance = self.storage_instance
        self.db_driver = PostgreSQLConnector()
        self.db_instance = self.db_driver
