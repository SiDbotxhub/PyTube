from aiohttp import web
import aiohttp_jinja2
import jinja2
from pathlib import Path
import os
import json
import time
from youtube_search import YoutubeSearch
from config import Config
import asyncio
import aiofiles
import datetime
# Initialize cache directory
os.makedirs(Config.CACHE_DIR, exist_ok=True)

async def get_cached_data(key):
    cache_file = Path(Config.CACHE_DIR) / f"{key}.json"
    if not cache_file.exists():
        return None
    
    async with aiofiles.open(cache_file, 'r') as f:
        data = await f.read()
        try:
            return json.loads(data)
        except json.JSONDecodeError:
            return None

async def set_cached_data(key, data, timeout=Config.CACHE_TIMEOUT):
    cache_file = Path(Config.CACHE_DIR) / f"{key}.json"
    cache_data = {
        'data': data,
        'expires': time.time() + timeout
    }
    async with aiofiles.open(cache_file, 'w') as f:
        await f.write(json.dumps(cache_data))

async def clear_old_cache():
    now = time.time()
    cache_files = Path(Config.CACHE_DIR).glob('*.json')
    
    for cache_file in cache_files:
        async with aiofiles.open(cache_file, 'r') as f:
            try:
                data = json.loads(await f.read())
                if data.get('expires', 0) < now:
                    os.remove(cache_file)
            except:
                os.remove(cache_file)

async def get_location():
    """Get user's approximate location"""
    try:
        # Try HTML5 Geolocation first
        # (This would need to be implemented in your frontend JavaScript)
        
        # Fallback to IP-based location
        async with aiohttp.ClientSession() as session:
            async with session.get('https://ipinfo.io/json') as resp:
                data = await resp.json()
                return data.get('city', 'your location')
    except:
        return "your location"
        
async def get_location_endpoint(request):
    """
    Get city name from coordinates using Nominatim (OpenStreetMap)
    Requires 'aiohttp' and 'async_timeout'
    """
    lat = request.query.get('lat')
    lon = request.query.get('lon')
    
    if not lat or not lon:
        return web.json_response({'city': 'your location'}, status=400)
    
    try:
        async with aiohttp.ClientSession() as session:
            # Using Nominatim API (free tier)
            url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
            
            # Set a proper user-agent header as required by Nominatim
            headers = {
                'User-Agent': 'StreamTube Music App (your-email@example.com)'
            }
            
            async with session.get(url, headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    city = data.get('address', {}).get('city') or \
                           data.get('address', {}).get('town') or \
                           data.get('address', {}).get('village') or \
                           'your location'
                    return web.json_response({'city': city})
                return web.json_response({'city': 'your location'})
    
    except Exception as e:
        print(f"Location error: {str(e)}")
        return web.json_response({'city': 'your location'})

async def index(request):
    # Get user's location
    location = await get_location()  # Implement this function to get real location
    
    # Determine time-based greeting
    hour = datetime.now().hour
    if hour < 12:
        greeting = "Good morning"
    elif hour < 18:
        greeting = "Good afternoon"
    else:
        greeting = "Good evening"
    
    # Get liked songs count (mock data - replace with real DB query)
    liked_count = 0
    if Config.USE_DATABASE:
        liked_count = await liked_songs.count_documents({'user_id': 'current_user'})
    
    context = {
        'greeting': greeting,
        'location': location,
        'liked_count': liked_count
    }
    return aiohttp_jinja2.render_template('home.html', request, context)
    
async def search(request):
    query = request.query.get('q', '')
    cache_key = f"search_{query.lower()}"
    
    # Try to get from cache first
    cached = await get_cached_data(cache_key)
    if cached:
        return web.json_response(cached['data'])
    
    results = YoutubeSearch(query, max_results=15).to_dict()
    processed = []
    
    for result in results:
        processed.append({
            'id': result['id'],
            'title': result['title'],
            'artist': result.get('channel', 'Unknown Artist'),
            'duration': result['duration'],
            'thumbnail': Config.YT_THUMBNAIL_URL.format(video_id=result['id']),
            'url': f"/player/{result['id']}"
        })
    
    response_data = {'results': processed}
    await set_cached_data(cache_key, response_data)
    return web.json_response(response_data)

async def player(request):
    video_id = request.match_info.get('video_id')
    return aiohttp_jinja2.render_template('player.html', request, {
        'video_id': video_id,
        'stream_url': Config.STREAM_API_URL.format(video_id=video_id),
        'thumbnail': Config.YT_THUMBNAIL_URL.format(video_id=video_id)
    })

async def like_song(request):
    if not Config.USE_DATABASE:
        return web.json_response({'status': 'Database not configured'}, status=400)
    
    data = await request.json()
    await set_cached_data(f"liked_{data['user_id']}_{data['song_id']}", {'liked': True})
    return web.json_response({'status': 'success'})

async def get_liked_songs(request):
    # Implement actual DB query if needed
    return web.json_response({'songs': []})
    
def setup_routes(app):
    app.router.add_get('/', index)
    app.router.add_get('/search', index)  # Search view
    app.router.add_get('/library', index)  # Library view
    app.router.add_get('/player/{video_id}', player)

    app.router.add_get('/api/location', get_location_endpoint)
    # API endpoints
    app.router.add_get('/api/search', search)
    app.router.add_post('/api/like', like_song)
    app.router.add_get('/api/liked', get_liked_songs)
    
    # Static files
    app.router.add_static('/static/', path=Path(__file__).parent / 'static')

async def init_app():
    app = web.Application()
    aiohttp_jinja2.setup(
        app,
        loader=jinja2.FileSystemLoader(Path(__file__).parent / 'templates'),
        context_processors=[aiohttp_jinja2.request_processor]
    )
    setup_routes(app)
    return app

def main():
    web.run_app(init_app(), port=8080)

if __name__ == '__main__':
    main()
