class CacheManager {
    constructor() {
        this.cacheName = 'streamtube-cache';
        this.maxItems = Config.MAX_CACHE_SIZE;
    }

    async get(key) {
        try {
            const cache = await caches.open(this.cacheName);
            const response = await cache.match(`/cache/${key}`);
            
            if (!response) return null;
            
            const data = await response.json();
            if (data.expires < Date.now()) {
                await this.delete(key);
                return null;
            }
            
            return data.data;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    async set(key, data, ttl = Config.CACHE_TIMEOUT * 1000) {
        try {
            const cache = await caches.open(this.cacheName);
            const cacheData = {
                data,
                expires: Date.now() + ttl
            };
            
            const response = new Response(JSON.stringify(cacheData), {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            await cache.put(`/cache/${key}`, response);
            
            // Enforce max cache size
            const keys = await cache.keys();
            if (keys.length > this.maxItems) {
                await cache.delete(keys[0]);
            }
        } catch (error) {
            console.error('Cache set error:', error);
        }
    }

    async delete(key) {
        const cache = await caches.open(this.cacheName);
        return cache.delete(`/cache/${key}`);
    }

    async clear() {
        return caches.delete(this.cacheName);
    }
}

const cacheManager = new CacheManager();
