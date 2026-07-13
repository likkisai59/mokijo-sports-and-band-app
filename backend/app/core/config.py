import os
import logging
from pathlib import Path
import yaml
from dotenv import load_dotenv

# Set up basic logging for config initialization
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
config_logger = logging.getLogger(__name__)

# Search for .env file in multiple directories
env_paths = [
    Path(__file__).resolve().parents[1] / ".env",  # app/.env
    Path(__file__).resolve().parents[2] / ".env"   # root .env
]
for path in env_paths:
    if path.exists():
        load_dotenv(dotenv_path=path)
        config_logger.info(f"Loaded .env from {path}")
        break

class Config:
    def __init__(self):
        # Database setup with postgres:// -> postgresql:// conversion logic
        db_url = os.getenv("DATABASE_URL")
        if db_url and db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        self.DATABASE_URL: str = db_url

        self.RAZORPAY_KEY_ID: str = (os.getenv("RAZORPAY_KEY_ID") or "").strip().strip('"').strip("'")
        self.RAZORPAY_KEY_SECRET: str = (os.getenv("RAZORPAY_KEY_SECRET") or "").strip().strip('"').strip("'")
        self.RAZORPAY_CURRENCY: str = os.getenv("RAZORPAY_CURRENCY", "INR")

        self.EMAIL_HOST: str = os.getenv("EMAIL_HOST", "smtp.gmail.com")
        self.EMAIL_PORT: int = int(os.getenv("EMAIL_PORT", 587))
        self.EMAIL_USER: str = os.getenv("EMAIL_USER", "sameerjansayed05@gmail.com")
        self.EMAIL_PASSWORD: str = os.getenv("EMAIL_PASSWORD", "fylodmkaarbeyllt")

        self.FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
        
        self.APP_ENV: str = os.getenv("APP_ENV") or "dev"
        self.ENVIRONMENT: str = self.APP_ENV

        self.JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY") or "default_secret_key_change_me"
        self.ACCESS_TOKEN_EXPIRE_MINUTES = 30
        self.REFRESH_TOKEN_EXPIRE_MINUTES = 30

        # Load service configurations from config.yaml
        self.config_file = 'app/config/config.yaml'
        if os.path.exists(self.config_file):
            with open(self.config_file, 'r') as file:
                self.config = yaml.safe_load(file)
            config_logger.info(f"Config is set from the file {self.config_file}")
            
            self.SERVICE_NAME = self.config.get("service", {}).get("name", "mukijo-backend")
            self.SERVICE_VERSION = self.config.get("service", {}).get("version", "1.0.0")
        else:
            self.config = {}
            self.SERVICE_NAME = "mukijo-backend"
            self.SERVICE_VERSION = "1.0.0"
            config_logger.warning(f"Config file {self.config_file} not found. Proceeding with default values.")

config = Config()

def get_settings():
    return config

# Maintain backwards compatibility for existing code that imports variables directly
DATABASE_URL = config.DATABASE_URL
RAZORPAY_KEY_ID = config.RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET = config.RAZORPAY_KEY_SECRET
RAZORPAY_CURRENCY = config.RAZORPAY_CURRENCY
EMAIL_HOST = config.EMAIL_HOST
EMAIL_PORT = config.EMAIL_PORT
EMAIL_USER = config.EMAIL_USER
EMAIL_PASSWORD = config.EMAIL_PASSWORD
FRONTEND_URL = config.FRONTEND_URL
