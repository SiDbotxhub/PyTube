class MusicPlayer {
    constructor() {
        this.audio = document.getElementById('audio-element');
        this.playBtn = document.querySelector('.play-btn');
        this.progressBar = document.querySelector('.progress-bar');
        this.progress = document.querySelector('.progress');
        this.currentTimeEl = document.querySelector('.time-current');
        this.totalTimeEl = document.querySelector('.time-total');
        this.volumeSlider = document.querySelector('.volume-slider');
        this.likeBtn = document.querySelector('.like-btn');
        this.shuffleBtn = document.querySelector('.shuffle-btn');
        this.repeatBtn = document.querySelector('.repeat-btn');
        this.songTitle = document.querySelector('.song-title');
        this.songArtist = document.querySelector('.song-artist');
        this.albumArt = document.querySelector('.now-playing-cover');
        
        this.isPlaying = false;
        this.isShuffled = false;
        this.isRepeated = false;
        this.isLiked = false;
        this.currentSongId = null;
        
        this.init();
    }
    
    init() {
        // Get song ID from URL
        this.currentSongId = window.location.pathname.split('/').pop();
        
        // Set up event listeners
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.progressBar.addEventListener('click', (e) => this.setProgress(e));
        this.volumeSlider.addEventListener('input', () => this.setVolume());
        this.likeBtn.addEventListener('click', () => this.toggleLike());
        this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        this.repeatBtn.addEventListener('click', () => this.toggleRepeat());
        
        // Audio event listeners
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.songEnded());
        this.audio.addEventListener('loadedmetadata', () => {
            this.totalTimeEl.textContent = this.formatTime(this.audio.duration);
        });
        
        // Check if song is liked
        this.checkIfLiked();
        
        // Start playing
        this.play();
    }
    
    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    play() {
        this.audio.play()
            .then(() => {
                this.isPlaying = true;
                this.updatePlayButton();
            })
            .catch(error => {
                console.error('Playback failed:', error);
            });
    }
    
    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.updatePlayButton();
    }
    
    updatePlayButton() {
        const icon = this.isPlaying ? 'pause' : 'play';
        document.querySelectorAll('.play-btn').forEach(btn => {
            btn.innerHTML = `<i class="fas fa-${icon}"></i>`;
        });
    }
    
    updateProgress() {
        const { duration, currentTime } = this.audio;
        const progressPercent = (currentTime / duration) * 100;
        this.progress.style.width = `${progressPercent}%`;
        this.currentTimeEl.textContent = this.formatTime(currentTime);
    }
    
    setProgress(e) {
        const width = this.progressBar.clientWidth;
        const clickX = e.offsetX;
        const duration = this.audio.duration;
        this.audio.currentTime = (clickX / width) * duration;
    }
    
    setVolume() {
        this.audio.volume = this.volumeSlider.value / 100;
    }
    
    async toggleLike() {
        this.isLiked = !this.isLiked;
        this.updateLikeButton();
        
        try {
            const response = await fetch('/api/like', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ song_id: this.currentSongId })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update like status');
            }
        } catch (error) {
            console.error('Error:', error);
            // Revert like status if API call fails
            this.isLiked = !this.isLiked;
            this.updateLikeButton();
        }
    }
    
    updateLikeButton() {
        const icon = this.isLiked ? 'fas' : 'far';
        this.likeBtn.innerHTML = `<i class="${icon} fa-heart"></i>`;
        this.likeBtn.style.color = this.isLiked ? 'var(--primary)' : '';
    }
    
    async checkIfLiked() {
        if (!this.currentSongId) return;
        
        try {
            const response = await fetch('/api/liked');
            const data = await response.json();
            
            const isLiked = data.songs.some(song => song.song_id === this.currentSongId);
            this.isLiked = isLiked;
            this.updateLikeButton();
        } catch (error) {
            console.error('Error checking liked status:', error);
        }
    }
    
    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        this.shuffleBtn.style.color = this.isShuffled ? 'var(--primary)' : 'var(--text-secondary)';
        // In a full implementation, you would update the queue here
    }
    
    toggleRepeat() {
        this.isRepeated = !this.isRepeated;
        this.repeatBtn.style.color = this.isRepeated ? 'var(--primary)' : 'var(--text-secondary)';
        this.audio.loop = this.isRepeated;
    }
    
    songEnded() {
        if (!this.isRepeated) {
            // In a full implementation, play next song in queue
            console.log('Song ended - play next track');
        }
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
}

// Initialize player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('audio-element')) {
        new MusicPlayer();
    }
    
    // Tab switching for library page
    const tabBtns = document.querySelectorAll('.tab-btn');
    if (tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active class from all buttons and tabs
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked button and corresponding tab
                this.classList.add('active');
                const tabId = this.getAttribute('data-tab') + '-tab';
                document.getElementById(tabId).classList.add('active');
                
                // Load content for the tab if needed
                if (tabId === 'liked-tab') {
                    loadLikedSongs();
                } else if (tabId === 'recent-tab') {
                    loadRecentTracks();
                }
            });
        });
    }
    
    // Load initial content for library
    if (document.getElementById('user-playlists')) {
        loadUserPlaylists();
    }
});

async function loadUserPlaylists() {
    // In a real app, this would come from your API
    const mockPlaylists = [
        { id: 'pl1', name: 'Workout Mix', songCount: 12, image: '/static/images/playlist1.jpg' },
        { id: 'pl2', name: 'Chill Vibes', songCount: 8, image: '/static/images/playlist2.jpg' },
        { id: 'pl3', name: 'Road Trip', songCount: 15, image: '/static/images/playlist3.jpg' }
    ];
    
    const container = document.getElementById('user-playlists');
    container.innerHTML = '';
    
    mockPlaylists.forEach(playlist => {
        const card = document.createElement('div');
        card.className = 'playlist-card';
        card.innerHTML = `
            <img src="${playlist.image}" alt="${playlist.name}" class="playlist-cover">
            <h3 class="playlist-name">${playlist.name}</h3>
            <p class="playlist-count">${playlist.songCount} songs</p>
        `;
        container.appendChild(card);
        
        card.addEventListener('click', () => {
            // In a real app, this would open the playlist
            console.log('Opening playlist:', playlist.name);
        });
    });
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
    const countEl = document.getElementById('liked-count');
    
    if (!container) return;
    
    countEl.textContent = `${songs.length} liked ${songs.length === 1 ? 'song' : 'songs'}`;
    
    if (songs.length === 0) {
        container.innerHTML = '<p class="empty-message">No liked songs yet</p>';
        return;
    }
    
    let html = '';
    
    songs.forEach((song, index) => {
        html += `
            <div class="song-item" data-id="${song.song_id}">
                <div class="song-number">${index + 1}</div>
                <img src="${song.thumbnail || '/static/images/default-song.jpg'}" class="song-thumbnail">
                <div class="song-info">
                    <h4>${song.title || 'Unknown Song'}</h4>
                    <p>${song.artist || 'Unknown Artist'}</p>
                </div>
                <div class="song-duration">${song.duration || '3:45'}</div>
                <button class="song-menu"><i class="fas fa-ellipsis-h"></i></button>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Add click handlers to play songs
    document.querySelectorAll('.song-item').forEach(item => {
        item.addEventListener('click', function() {
            const songId = this.getAttribute('data-id');
            window.location.href = `/player/${songId}`;
        });
    });
}

async function loadRecentTracks() {
    // In a real app, this would come from your API
    const mockRecent = [
        { id: 'rec1', title: 'Popular Song', artist: 'Famous Artist', thumbnail: '/static/images/song1.jpg', playedAt: '2 hours ago' },
        { id: 'rec2', title: 'Chill Beat', artist: 'Relaxing Sounds', thumbnail: '/static/images/song2.jpg', playedAt: 'Yesterday' },
        { id: 'rec3', title: 'Energy Boost', artist: 'Workout Mix', thumbnail: '/static/images/song3.jpg', playedAt: '3 days ago' }
    ];
    
    const container = document.getElementById('recent-tracks-list');
    container.innerHTML = '';
    
    mockRecent.forEach(track => {
        const item = document.createElement('div');
        item.className = 'recent-item';
        item.innerHTML = `
            <img src="${track.thumbnail}" alt="${track.title}" class="recent-thumbnail">
            <div class="recent-info">
                <h4>${track.title}</h4>
                <p>${track.artist} • ${track.playedAt}</p>
            </div>
            <button class="recent-play"><i class="fas fa-play"></i></button>
        `;
        container.appendChild(item);
        
        item.querySelector('.recent-play').addEventListener('click', (e) => {
            e.stopPropagation();
            window.location.href = `/player/${track.id}`;
        });
        
        item.addEventListener('click', () => {
            window.location.href = `/player/${track.id}`;
        });
    });
}
