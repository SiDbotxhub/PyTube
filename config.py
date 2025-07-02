import os

class Config:
    # Database configuration
    MONGO_URI = os.getenv("MONGO_URI", None)
    USE_DATABASE = bool(MONGO_URI)
    
    # API configuration
    STREAM_API_BASE = "http://deadlinetech.site/stream"
    STREAM_API_KEY = "dc5lhBaaA2qHctJMQFjMyJgF"
    
    # App configuration
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
