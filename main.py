from aiohttp import web
import aiohttp_jinja2
import jinja2
from pathlib import Path
from youtube_search import YoutubeSearch
from config import Config
import json
import os
from datetime import datetime
import asyncio

# If database is enabled
if Config.USE_DATABASE:
    from motor.motor_asyncio import AsyncIOMotorClient
    db_client = AsyncIOMotorClient(Config.MONGO_URI)
    db = db_client.get_default_database()
    users = db.users
    playlists = db.playlists

async def index(request):
    return aiohttp_jinja2.render_template('index.html', request, {})

async def search(request):
    data = await request.post()
    query = data.get('query', '')
    
    # Search YouTube
    results = YoutubeSearch(query, max_results=10).to_dict()
    
    # Process results
    songs = []
    for result in results:
        songs.append({
            'title': result['title'],
            'duration': result['duration'],
            'thumbnail': result['thumbnails'][0],
            'video_id': result['id'],
            'url': f"{Config.STREAM_API_BASE}/{result['id']}?key={Config.STREAM_API_KEY}"
        })
    
    return web.json_response({'songs': songs})

async def get_stream_url(request):
    video_id = request.match_info.get('video_id')
    stream_url = f"{Config.STREAM_API_BASE}/{video_id}?key={Config.STREAM_API_KEY}"
    return web.json_response({'stream_url': stream_url})

async def get_recently_played(request):
    # If database is enabled, fetch from DB
    if Config.USE_DATABASE:
        # This is a placeholder - implement actual DB query
        recent_plays = []
    else:
        # Mock data for when DB is not available
        recent_plays = [
            {"title": "My Playlist #1", "type": "playlist"},
            {"title": "Discover Weekly", "type": "playlist"},
            {"title": "Top Hits 2024", "type": "playlist"}
        ]
    
    return web.json_response({'recently_played': recent_plays})

def setup_routes(app):
    app.router.add_get('/', index)
    app.router.add_post('/api/search', search)
    app.router.add_get('/api/stream/{video_id}', get_stream_url)
    app.router.add_get('/api/recently_played', get_recently_played)
    
    # Static files
    app.router.add_static('/static/', path=str(Path(__file__).parent / 'static'), name='static')

async def init_app():
    app = web.Application()
    
    # Setup Jinja2 template engine
    aiohttp_jinja2.setup(
        app,
        loader=jinja2.FileSystemLoader(str(Path(__file__).parent / 'templates'))
    )
    
    setup_routes(app)
    return app

def main():
    web.run_app(init_app(), port=8080)

if __name__ == '__main__':
    main()
