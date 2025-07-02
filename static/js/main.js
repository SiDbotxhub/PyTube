document.addEventListener('DOMContentLoaded', function() {
    // Search functionality
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
        
        // If there's a query in the URL (from back button), search immediately
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');
        if (query) {
            searchInput.value = query;
            handleSearch({ target: searchInput });
        }
    }
    
    // Player bar controls
    const miniPlayBtn = document.querySelector('.player-bar .play-btn');
    if (miniPlayBtn) {
        miniPlayBtn.addEventListener('click', function() {
            // This would control the main audio element
            console.log('Play/pause from mini player');
        });
    }
    
    // Load recommended and recent tracks
    if (document.getElementById('recommended-tracks')) {
        loadRecommendedTracks();
        loadRecentTracks();
    }
    
    // Load liked songs if on library page
    if (document.getElementById('liked-songs-list')) {
        loadLikedSongs();
    }
});

function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

async function handleSearch(e) {
    const query = e.target.value.trim();
    if (query.length < 2) {
        document.getElementById('search-results').innerHTML = `
            <div class="results-placeholder">
                <i class="fas fa-music"></i>
                <p>Search for songs, artists, or albums</p>
            </div>
        `;
        return;
    }
    
    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        displaySearchResults(data.results);
    } catch (error) {
        console.error('Search error:', error);
    }
}

function displaySearchResults(results) {
    const resultsContainer = document.getElementById('search-results');
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="results-placeholder">
                <i class="fas fa-search"></i>
                <p>No results found</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="results-grid">';
    
    results.forEach(track => {
        html += `
            <div class="track-card" data-id="${track.id}">
                <img src="${track.thumbnail}" alt="${track.title}" class="track-cover">
                <h3 class="track-title">${track.title}</h3>
                <p class="track-artist">${track.artist}</p>
            </div>
        `;
    });
    
    html += '</div>';
    resultsContainer.innerHTML = html;
    
    // Add click handlers to play tracks
    document.querySelectorAll('.track-card').forEach(card => {
        card.addEventListener('click', function() {
            const trackId = this.getAttribute('data-id');
            window.location.href = `/player/${trackId}`;
        });
    });
}

async function loadRecommendedTracks() {
    // In a real app, this would come from your API
    const mockTracks = [
        {
            id: 'abc123',
            title: 'Popular Song',
            artist: 'Famous Artist',
            thumbnail: 'https://i.ytimg.com/vi/default.jpg'
        },
        // More mock tracks...
    ];
    
    const container = document.getElementById('recommended-tracks');
    container.innerHTML = '';
    
    mockTracks.forEach(track => {
        const card = document.createElement('div');
        card.className = 'track-card';
        card.setAttribute('data-id', track.id);
        card.innerHTML = `
            <img src="${track.thumbnail}" alt="${track.title}" class="track-cover">
            <h3 class="track-title">${track.title}</h3>
            <p class="track-artist">${track.artist}</p>
        `;
        container.appendChild(card);
        
        card.addEventListener('click', function() {
            window.location.href = `/player/${track.id}`;
        });
    });
}

async function loadRecentTracks() {
    // Similar to loadRecommendedTracks but for recent plays
}

async function loadLikedSongs() {
    try {
        const response = await fetch('/api/liked');
        const data = await response.json();
        displayLikedSongs(data.songs);
    } catch (error) {
        console.error('Error loading liked songs:', error);
    }
}

function displayLikedSongs(songs) {
    const container = document.getElementById('liked-songs-list');
    if (!container) return;
    
    if (songs.length === 0) {
        container.innerHTML = '<p>No liked songs yet</p>';
        return;
    }
    
    let html = '<div class="songs-list">';
    
    songs.forEach(song => {
        html += `
            <div class="song-item" data-id="${song.song_id}">
                <img src="${song.thumbnail || 'https://i.ytimg.com/vi/default.jpg'}" class="song-thumbnail">
                <div class="song-info">
                    <h4>${song.title || 'Unknown Song'}</h4>
                    <p>${song.artist || 'Unknown Artist'}</p>
                </div>
                <button class="play-btn"><i class="fas fa-play"></i></button>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Add play buttons
    document.querySelectorAll('.song-item .play-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const songId = this.closest('.song-item').getAttribute('data-
