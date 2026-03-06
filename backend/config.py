import os
import json
import argparse
import sys
import logging
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

# XDG Base Directory Specification defaults
DEFAULT_CONFIG_HOME = os.path.expanduser("~/.config")
APP_NAME = "webtermcom"

class AppConfig(BaseModel):
    """
    Application configuration for WebTermCom.
    Follows CloudBSD guidelines for configuration management.
    """
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "INFO"  # DEBUG, INFO, WARN, ERROR
    allow_cors: bool = True
    session_timeout_minutes: int = 60
    # Additional settings can be added here
    
    class Config:
        extra = "ignore"

def get_config_path() -> str:
    """
    Determine the configuration file path following XDG standards and CloudBSD system-wide defaults.
    """
    # 1. Check for system-wide configuration (CloudBSD priority)
    system_config = f"/usr/local/etc/cloudbsd/{APP_NAME}/config.json"
    if os.path.exists(system_config):
        return system_config
        
    # 2. Check XDG_CONFIG_HOME
    xdg_config_home = os.environ.get("XDG_CONFIG_HOME", DEFAULT_CONFIG_HOME)
    user_config = os.path.join(xdg_config_home, APP_NAME, "config.json")
    if os.path.exists(user_config):
        return user_config
        
    return ""

def load_config(path: Optional[str] = None) -> AppConfig:
    """
    Load the application configuration from a JSON file.
    """
    if not path:
        path = get_config_path()
        
    if not path or not os.path.exists(path):
        # Fallback to defaults if no config file found
        return AppConfig()
        
    try:
        with open(path, 'r') as f:
            data = json.load(f)
            return AppConfig(**data)
    except Exception as e:
        print(f"Error loading configuration from {path}: {e}", file=sys.stderr)
        # Guidelines say: Reject invalid configurations with non-zero exit codes.
        sys.exit(1)

def validate_config(config_path: str) -> bool:
    """
    Validate the configuration file without starting the service.
    Follows the --check-config requirement.
    """
    if not os.path.exists(config_path):
        print(f"Error: Configuration file not found at {config_path}", file=sys.stderr)
        return False
        
    try:
        with open(config_path, 'r') as f:
            data = json.load(f)
            AppConfig(**data)
        print(f"Configuration at {config_path} is valid.")
        return True
    except Exception as e:
        print(f"Configuration validation failed: {e}", file=sys.stderr)
        return False

def setup_logging(level: str):
    """
    Configure logging based on the provided level.
    Follows the 'Log Level' configuration requirement.
    """
    numeric_level = getattr(logging, level.upper(), None)
    if not isinstance(numeric_level, int):
        numeric_level = logging.INFO
        
    logging.basicConfig(
        level=numeric_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%dT%H:%M:%SZ' # ISO 8601 as per guidelines
    )
