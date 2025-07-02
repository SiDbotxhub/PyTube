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
import requests
from urllib.parse import quote

# Database setup
if Config.USE_DATABASE:
    from motor.motor_asyncio import AsyncIOMotorClient
    db_client = AsyncIOMotorClient(Config.MONGO_URI)
    db = db_client.get_default_database()
    users = db.users
    playlists = db.playlists
    liked_songs = db.liked_songs

async def get_location():
    try:
        response = requests.get('https://ipinfo.io/json')
        data = response.json()
        return data.get('city', 'your location')
    except:
        return 'your location'

async def index(request):
    location = await get_location()
    context = {
        'location': location,
        'greeting': get_greeting()
    }
    return aiohttp_jinja2.render_template('home.html', request, context)

async def search_view(request):
    query = request.query.get('q', '')
    context = {'query': query}
    return aiohttp_jinja2.render_template('search.html', request, context)

async def library_view(request):
    return aiohttp_jinja2.render_template('library.html', request, {})

async def player_view(request):
    video_id = request.match_info.get('video_id')
    stream_url = f"{Config.STREAM_API_BASE}/{video_id}?key={Config.STREAM_API_KEY}"
    
    # Get video details (you would normally fetch this from YouTube API)
    video_details = {
        'title': "Currently Playing",
        'artist': "Artist Name",
        'duration': "3:45",
        'thumbnail': "https://i.ytimg.com/vi/default.jpg"
    }
    
    context = {
        'stream_url': stream_url,
        'video_details': video_details
    }
    return aiohttp_jinja2.render_template('player.html', request, context)

async def api_search(request):
    query = request.query.get('q', '')
    results = YoutubeSearch(query, max_results=15).to_dict()
    
    songs = []
    for result in results:
        songs.append({
            'id': result['id'],
            'title': result['title'],
            'artist': result.get('channel', 'Unknown Artist'),
            'duration': result['duration'],
            'thumbnail': result['thumbnails'][0],
            'url': f"/player/{result['id']}"
        })
    
    return web.json_response({'results': songs})

async def api_like_song(request):
    if not Config.USE_DATABASE:
        return web.json_response({'status': 'Database not configured'}, status=400)
    
    data = await request.json()
    await liked_songs.insert_one({
        'user_id': 'current_user',  # Replace with actual user ID
        'song_id': data['song_id'],
        'timestamp': datetime.now()
    })
    return web.json_response({'status': 'success'})

async def api_get_liked_songs(request):
    if not Config.USE_DATABASE:
        return web.json_response({'songs': []})
    
    songs = await liked_songs.find({'user_id': 'current_user'}).to_list(100)
    return web.json_response({'songs': songs})

def get_greeting():
    hour = datetime.now().hour
    if hour < 12:
        return "Good morning"
    elif hour < 18:
        return "Good afternoon"
    else:
        return "Good evening"

def setup_routes(app):
    # Views
    app.router.add_get('/', index)
    app.router.add_get('/search', search_view)
    app.router.add_get('/library', library_view)
    app.router.add_get('/player/{video_id}', player_view)
    
    # API Endpoints
    app.router.add_get('/api/search', api_search)
    app.router.add_post('/api/like', api_like_song)
    app.router.add_get('/api/liked', api_get_liked_songs)
    
    # Static files
    app.router.add_static('/static/', path=str(Path(__file__).parent / 'static'), name='static')

async def init_app():
    app = web.Application()
    aiohttp_jinja2.setup(
        app,
        loader=jinja2.FileSystemLoader(str(Path(__file__).parent / 'templates')),
        context_processors=[aiohttp_jinja2.request_processor]
    )
    setup_routes(app)
    return app

def main():
    web.run_app(init_app(), port=8080)

if __name__ == '__main__':
    main()
