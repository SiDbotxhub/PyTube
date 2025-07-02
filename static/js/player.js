class MusicPlayer {
    constructor() {
        this.audio = new Audio();
        this.currentTrack = null;
        this.queue = [];
        this.history = [];
        
        // Player state
        this.isPlaying = false;
        this.isShuffled = false;
        this.isRepeated = false;
        this.volume = 0.8;
        this.currentTime = 0;
        
        // DOM elements
        this.dom = {
            playerBar: document.querySelector('.player-bar'),
            playerModal: document.querySelector('.player-modal'),
            modalContent: document.querySelector('.player-modal-content .modal-body'),
            closeModal: document.querySelector('.close-modal'),
            playBtn: document.querySelector('.play-btn'),
            prevBtn: document.querySelector('.prev-btn'),
            nextBtn: document.querySelector('.next-btn'),
            shuffleBtn: document.querySelector('.shuffle-btn'),
            repeatBtn: document.querySelector('.repeat-btn'),
            likeBtn: document.querySelector('.like-btn'),
            progressBar: document.querySelector('.progress-bar'),
            progress: document.querySelector('.progress'),
            currentTime: document.querySelector('.time-current'),
            totalTime: document.querySelector('.time-total'),
            volumeSlider: document.querySelector('.volume-slider'),
            songTitle: document.querySelector('.song-title'),
            songArtist: document.querySelector('.song-artist'),
            albumArt: document.querySelector('.now-playing-cover')
        };
        
        this.init();
    }
    
    init() {
        // Event listeners
        this.dom.playBtn.addEventListener('click', () => this.togglePlay());
        this.dom.prevBtn.addEventListener('click', () => this.prevTrack());
        this.dom.nextBtn.addEventListener('click', () => this.nextTrack());
        this.dom.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        this.dom.repeatBtn.addEventListener('click', () => this.toggleRepeat());
        this.dom.likeBtn.addEventListener('click', () => this.toggleLike());
        this.dom.progressBar.addEventListener('click', (e) => this.seek(e));
        this.dom.volumeSlider.addEventListener('input', () => this.setVolume());
        this.dom.closeModal.addEventListener('click', () => this.closePlayer());
        
        // Audio events
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.onTrackEnd());
        this.audio.addEventListener('loadedmetadata', () => this.onMetadataLoaded());
        
        // Load player state from cache
        this.loadState();
        
        // Check for URL with video_id
        const path = window.location.pathname.split('/');
        if (path[1] === 'player' && path[2]) {
            this.loadTrack(path[2]);
        }
    }
    
    async loadTrack(videoId) {
        try {
            // Show loading state
            this.dom.songTitle.textContent = 'Loading...';
            this.dom.songArtist.textContent = '';
            
            // Get track info
            const response = await fetch(`/api/track/${videoId}`);
            const track = await response.json();
            
            this.currentTrack = track;
            this.audio.src = track.streamUrl;
            
            // Update UI
            this.dom.songTitle.textContent = track.title;
            this.dom.songArtist.textContent = track.artist;
            this.dom.albumArt.src = track.thumbnail;
            this.dom.albumArt.alt = track.title;
            
            // Play the track
            this.play();
            
            // Add to history
            this.addToHistory(track);
            
            // Save state
            this.saveState();
            
            // Open player modal if on mobile
            if (window.innerWidth < 768) {
                this.openPlayer();
            }
        } catch (error) {
            console.error('Error loading track:', error);
            this.dom.songTitle.textContent = 'Error loading track';
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
    
    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    // ... (other player methods remain similar but optimized)
    
    openPlayer() {
        if (!this.currentTrack) return;
        
        // Load player modal content
        this.dom.modalContent.innerHTML = `
            <div class="album-art">
                <img src="${this.currentTrack.thumbnail}" alt="${this.currentTrack.title}">
            </div>
            <div class="track-info">
                <h2>${this.currentTrack.title}</h2>
                <p>${this.currentTrack.artist}</p>
            </div>
            <div class="player-controls-modal">
                <!-- Add modal-specific controls -->
            </div>
        `;
        
        this.dom.playerModal.classList.remove('hidden');
    }
    
    closePlayer() {
        this.dom.playerModal.classList.add('hidden');
    }
    
    // Cache management
    async saveState() {
        const state = {
            currentTrack: this.currentTrack,
            queue: this.queue,
            history: this.history.slice(-10), // Keep last 10 tracks
            volume: this.volume,
            isShuffled: this.isShuffled,
            isRepeated: this.isRepeated,
            timestamp: Date.now()
        };
        
        await cacheManager.set('player_state', state);
    }
    
    async loadState() {
        const state = await cacheManager.get('player_state');
        if (state) {
            this.currentTrack = state.currentTrack;
            this.queue = state.queue || [];
            this.history = state.history || [];
            this.volume = state.volume || 0.8;
            this.isShuffled = state.isShuffled || false;
            this.isRepeated = state.isRepeated || false;
            
            if (this.currentTrack) {
                this.audio.src = this.currentTrack.streamUrl;
                this.audio.volume = this.volume;
                this.updateUI();
            }
        }
    }
}

// Initialize player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.player = new MusicPlayer();
});
