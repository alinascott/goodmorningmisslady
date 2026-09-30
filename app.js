/**
 * Belize Audio Archive - Application Logic
 * Handles rendering, filtering, and playback of audio clips
 */

class AudioArchive {
  constructor(containerId = 'audio-list') {
    this.container = document.getElementById(containerId);
    this.wavesurferInstances = {};
    this.loadErrors = [];
    this.init();
  }

  init() {
    if (!this.container) {
      console.error('❌ Audio container not found');
      return;
    }

    if (typeof WaveSurfer === 'undefined') {
      console.error('❌ WaveSurfer library not available');
      this.container.innerHTML = '<p style="color: #dc3545; padding: 1rem;">Audio player library failed to load. Please refresh the page.</p>';
      return;
    }

    this.renderCards();
    this.bindFilters();
    console.log('✅ Audio Archive initialized');
  }

  renderCards() {
    if (!audioData || audioData.length === 0) {
      console.error('❌ No audio data available');
      return;
    }

    audioData.forEach(item => {
      const card = this.createCard(item);
      this.container.appendChild(card);
      this.initializeWaveSurfer(item);
    });
  }

  createCard(item) {
    const card = document.createElement('div');
    card.className = `audio-card category-${item.category}`;
    card.id = `card-${item.id}`;
    card.setAttribute('data-category', item.category);

    const locationTagsHTML = item.locations
      .map(loc => `<span class="tag tag-location">${this.escapeHtml(loc)}</span>`)
      .join('');

    const featuredPersonHTML = item.featuredPerson
      ? `<span class="meta-info">${this.escapeHtml(item.featuredPerson)}</span>`
      : '';

    card.innerHTML = `
      <div class="card-header">
        <h2 class="card-title">${this.escapeHtml(item.title)}</h2>
        <div class="tags-wrapper">
          <span class="tag tag-${item.category}">${this.escapeHtml(item.categoryLabel)}</span>
          ${locationTagsHTML}
        </div>
      </div>
      <p class="card-description">${this.escapeHtml(item.description)}</p>
      <div class="waveform-wrapper" role="region" aria-label="Audio player for ${this.escapeHtml(item.title)}">
        <div class="waveform-loading" id="loading-${item.id}">Loading audio...</div>
        <div id="waveform-${item.id}" class="waveform-player"></div>
      </div>
      <div class="card-controls">
        <button 
          class="play-btn" 
          id="btn-${item.id}" 
          onclick="audioArchive.togglePlay('${item.id}')"
          aria-label="Play or pause: ${this.escapeHtml(item.title)}">
          Play
        </button>
        <span class="time-display" id="time-${item.id}" style="display: none;">
          <span class="current-time">0:00</span> / <span class="duration">0:00</span>
        </span>
        ${featuredPersonHTML}
      </div>
    `;

    return card;
  }

  initializeWaveSurfer(item) {
    const containerSelector = `#waveform-${item.id}`;
    const loadingEl = document.getElementById(`loading-${item.id}`);
    const timeDisplay = document.getElementById(`time-${item.id}`);
    const playButton = document.getElementById(`btn-${item.id}`);

    try {
      const progressColor = this.getProgressColor(item.category);

      const ws = WaveSurfer.create({
        container: containerSelector,
        waveColor: '#ced4da',
        progressColor: progressColor,
        height: 45,
        barWidth: 2,
        barGap: 2,
        url: item.audioUrl,
      });

      ws.on('ready', () => {
        console.log(`✅ Loaded: ${item.title}`);
        if (loadingEl) loadingEl.style.display = 'none';
        if (timeDisplay) timeDisplay.style.display = 'inline';
      });

      ws.on('error', (error) => {
        console.error(`❌ Failed to load: ${item.title} (${item.audioUrl})`, error);
        this.loadErrors.push({ id: item.id, title: item.title, url: item.audioUrl, error });
        if (loadingEl) {
          loadingEl.textContent = `❌ Audio unavailable: ${item.audioUrl}`;
          loadingEl.style.color = '#dc3545';
          loadingEl.style.fontSize = '0.75rem';
        }
        if (playButton) {
          playButton.disabled = true;
          playButton.textContent = 'Unavailable';
        }
      });

      ws.on('play', () => {
        if (playButton) {
          playButton.textContent = 'Pause';
          playButton.setAttribute('aria-label', `Pause: ${item.title}`);
        }
      });

      ws.on('pause', () => {
        if (playButton) {
          playButton.textContent = 'Play';
          playButton.setAttribute('aria-label', `Play: ${item.title}`);
        }
      });

      ws.on('finish', () => {
        if (playButton) {
          playButton.textContent = 'Play';
          playButton.setAttribute('aria-label', `Play: ${item.title}`);
        }
      });

      ws.on('timeupdate', (currentTime) => {
        const duration = ws.getDuration();
        if (timeDisplay) {
          timeDisplay.querySelector('.current-time').textContent = this.formatTime(currentTime);
          timeDisplay.querySelector('.duration').textContent = this.formatTime(duration);
        }
      });

      this.wavesurferInstances[item.id] = ws;
    } catch (error) {
      console.error(`❌ WaveSurfer initialization failed for ${item.title}:`, error);
      this.loadErrors.push({ id: item.id, title: item.title, error });
      if (loadingEl) {
        loadingEl.textContent = '❌ Player initialization failed';
        loadingEl.style.color = '#dc3545';
      }
      if (playButton) {
        playButton.disabled = true;
        playButton.textContent = 'Unavailable';
      }
    }
  }

  togglePlay(id) {
    if (!this.wavesurferInstances[id]) {
      console.error(`Audio instance not found for ${id}`);
      return;
    }

    Object.keys(this.wavesurferInstances).forEach(key => {
      if (key !== id) {
        this.wavesurferInstances[key].pause();
      }
    });

    this.wavesurferInstances[id].playPause();
  }

  bindFilters() {
    document.querySelectorAll('.filter-btn').forEach(button => {
      button.addEventListener('click', (event) => {
        const category = event.currentTarget.getAttribute('data-category');
        this.filterCategory(category, event.currentTarget);
      });
    });
  }

  filterCategory(category, buttonElement) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    });

    if (buttonElement) {
      buttonElement.classList.add('active');
      buttonElement.setAttribute('aria-selected', 'true');
    }

    document.querySelectorAll('.audio-card').forEach(card => {
      const cardCategory = card.getAttribute('data-category');
      const matches = category === 'all' || cardCategory === category;
      card.classList.toggle('hidden', !matches);
    });
  }

  getProgressColor(category) {
    const colors = {
      music: '#2980b9',
      logging: '#d35400',
      'oral-history': '#27ae60'
    };
    return colors[category] || '#2980b9';
  }

  formatTime(seconds) {
    if (!seconds || Number.isNaN(seconds) || seconds === Infinity) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  logLoadStatus() {
    console.group('📊 Audio Load Status');
    console.log(`Total clips: ${audioData.length}`);
    console.log(`Successfully loaded: ${audioData.length - this.loadErrors.length}`);
    console.log(`Failed: ${this.loadErrors.length}`);
    
    if (this.loadErrors.length > 0) {
      console.group('❌ Failed files:');
      this.loadErrors.forEach(error => {
        console.error(`  ${error.title}`);
        console.error(`  URL: ${error.url}`);
        if (error.error) console.error(`  Error: ${error.error}`);
      });
      console.groupEnd();
    }
    console.groupEnd();
  }
}

// Initialize on DOM ready
let audioArchive;
document.addEventListener('DOMContentLoaded', () => {
  audioArchive = new AudioArchive('audio-list');
});
