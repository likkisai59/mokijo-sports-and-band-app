"""
postgresql.py — PostgreSQL Singleton Database Connector (with connection pooling)
"""

import contextlib
import psycopg2
from psycopg2.pool import ThreadedConnectionPool
from psycopg2.extras import RealDictCursor
from app.core.config import get_settings
from app.logger import logger

settings = get_settings()


class PostgreSQLConnector:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        db_url = settings.DATABASE_URL
        if not db_url:
            logger.log_error_sync(message="DATABASE_URL environment variable is not set!")
            raise ValueError("DATABASE_URL is not set!")

        try:
            self.pool = ThreadedConnectionPool(
                minconn=1,
                maxconn=20,
                dsn=db_url
            )
            logger.log_message_sync(message="PostgreSQL Threaded Connection Pool initialized successfully.")
        except Exception as e:
            logger.log_error_sync(message=f"Failed to initialize PostgreSQL Connection Pool: {e}")
            raise e

    @contextlib.contextmanager
    def get_connection(self):
        conn = self.pool.getconn()
        try:
            yield conn
        finally:
            self.pool.putconn(conn)

    def check_connection_health(self) -> bool:
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT 1")
                    cursor.fetchone()
            return True
        except Exception as e:
            logger.log_error_sync(message=f"Database health check failed: {e}")
            return False

    def execute_query(self, query: str, params: tuple = None):
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(query, params)
                conn.commit()
        except Exception as e:
            logger.log_error_sync(message=f"Database execution error: {e} | Query: {query} | Params: {params}")
            raise e

    def fetch_one(self, query: str, params: tuple = None) -> dict:
        try:
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute(query, params)
                    res = cursor.fetchone()
                    return dict(res) if res else None
        except Exception as e:
            logger.log_error_sync(message=f"Database fetch_one error: {e} | Query: {query} | Params: {params}")
            raise e

    def fetch_all(self, query: str, params: tuple = None) -> list[dict]:
        try:
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute(query, params)
                    res = cursor.fetchall()
                    return [dict(row) for row in res] if res else []
        except Exception as e:
            logger.log_error_sync(message=f"Database fetch_all error: {e} | Query: {query} | Params: {params}")
            raise e

    def insert(self, table: str, data: dict, id_column: str = "id") -> any:
        """
        Dynamically constructs and runs an INSERT query.
        Returns the value of the inserted row's primary key (defaults to 'id').
        """
        if not data:
            raise ValueError("No data provided to insert.")

        columns = ", ".join(data.keys())
        placeholders = ", ".join(["%s"] * len(data))
        query = f"INSERT INTO {table} ({columns}) VALUES ({placeholders}) RETURNING {id_column}"
        params = tuple(data.values())

        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(query, params)
                    insert_id = cursor.fetchone()[0]
                conn.commit()
                return insert_id
        except Exception as e:
            logger.log_error_sync(message=f"Database insert error: {e} | Table: {table} | Data: {data}")
            raise e
