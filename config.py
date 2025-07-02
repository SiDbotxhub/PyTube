import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # App Config
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
    CACHE_TIMEOUT = int(os.getenv("CACHE_TIMEOUT", "3600"))  # 1 hour
    
    # Database
    MONGO_URI = os.getenv("MONGO_URI")
    USE_DATABASE = bool(MONGO_URI)
    
    # YouTube API
    YT_THUMBNAIL_URL = "https://img.youtube.com/vi/{video_id}/mqdefault.jpg"
    STREAM_API_URL = "http://deadlinetech.site/stream/{video_id}?key=dc5lhBaaA2qHctJMQFjMyJgF"
    
    # Cache Settings
    CACHE_DIR = ".cache"
    MAX_CACHE_SIZE = 50  # Max items to cache
