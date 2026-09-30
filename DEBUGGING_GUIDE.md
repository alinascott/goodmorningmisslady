# Belize Audio Archive - Debugging Guide

## 🔍 Troubleshooting Audio Playback Issues

### Quick Start
1. Open your browser's **Developer Console** (F12 or Cmd+Option+J)
2. Look for messages starting with ✅, ❌, or ⚠️
3. Follow the relevant section below

---

## 📊 Checking Load Status

### In Console
```javascript
// View all failed audio files
audioArchive.loadErrors

// Print formatted load status
audioArchive.logLoadStatus()
```

### Expected Output (Success)
```
✅ All audio files loaded successfully
```

### Expected Output (With Errors)
```
⚠️ Some audio files failed to load: [...]
❌ Failed to load: Wood cutters Radio Belize Introduction (audio/Wood cutters Radio Belize Introduction .mp3)
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Failed to load" error for all or some files

**Possible Causes:**
1. Audio folder doesn't exist
2. File names don't match exactly (including spaces and case)
3. Server doesn't have correct MIME type for .mp3
4. CORS issue (if hosting on different domain)

**Diagnosis Steps:**

```javascript
// Check if files are accessible
fetch('audio/Wood cutters Radio Belize Introduction .mp3')
  .then(r => {
    if (r.ok) console.log('✅ File is accessible');
    else console.log('❌ File returned status:', r.status);
  })
  .catch(e => console.error('❌ Network error:', e));
```

**Solutions:**

**A) Verify Audio Folder Structure**
```
goodmorningmisslady/
├── index.html
├── app.js
├── data.js
├── audio/                    ← MUST exist
│   ├── Wood cutters Radio Belize Introduction .mp3
│   ├── Wood cutters song 1 Bulldog nuh Bite Mi.mp3
│   └── ... (other audio files)
└── resources.html
```

**B) Fix File Name Mismatches**
Currently, `data.js` has these exact filenames:
```javascript
"audio/Wood cutters Radio Belize Introduction .mp3"     // ← Notice trailing space
"audio/Wood cutters song 1 Bulldog nuh Bite Mi.mp3"
"audio/Wood cutters song 2 .mp3"                         // ← Trailing space
"audio/Wood cutters song 3.mp3"
"audio/Wood cutters song 4.mp3"
"audio/Miss Floss' Freetown Gyal Sample.mp3"
"audio/Folk Songs by Miss Floss' School.mp3"
```

To verify what files actually exist on your server:
```javascript
// In browser console, test each URL
const urls = [
  'audio/Wood cutters Radio Belize Introduction .mp3',
  'audio/Wood cutters song 1 Bulldog nuh Bite Mi.mp3',
  // ... etc
];

urls.forEach(url => {
  fetch(url).then(r => {
    console.log(`${r.ok ? '✅' : '❌'} ${url}`);
  }).catch(e => console.log(`❌ ${url} - ${e.message}`));
});
```

**C) Server MIME Type Configuration**

If files load manually but not via WaveSurfer, configure your server:

**For Apache (.htaccess):**
```apache
AddType audio/mpeg mp3
```

**For Nginx:**
```nginx
types {
    audio/mpeg mp3;
}
```

**D) Fix CORS Issues**

If audio is hosted on a different domain:

```javascript
// In app.js, add crossOrigin to WaveSurfer
const ws = WaveSurfer.create({
  container: containerId,
  // ... other options
  url: item.audioUrl,
  mediaControls: true,  // Add this
  cursorColor: '#fff',  // Add this
});

// Update fetch to include credentials
ws.load(item.audioUrl, { credentials: 'include' });
```

---

### Issue 2: WaveSurfer library not loading

**Console Message:**
```
❌ WaveSurfer library failed to load.
```

**Solutions:**

**A) Check CDN Availability**
```javascript
// Open console and run:
fetch('https://unpkg.com/wavesurfer.js@7')
  .then(r => console.log('CDN Status:', r.status))
  .catch(e => console.error('CDN Error:', e));
```

**B) Use Fallback CDN**
Edit `index.html` and replace the script tag:
```html
<!-- Try alternative CDN -->
<script src="https://cdn.jsdelivr.net/npm/wavesurfer.js@7"></script>
```

**C) Offline Mode**
Download WaveSurfer locally:
1. Download from: https://unpkg.com/wavesurfer.js@7
2. Save to: `lib/wavesurfer.js`
3. Update index.html:
```html
<script src="lib/wavesurfer.js"></script>
```

---

### Issue 3: Play button doesn't work

**Diagnosis:**

```javascript
// Check if instances exist
Object.keys(audioArchive.wavesurferInstances).length

// Check a specific instance
console.log(audioArchive.wavesurferInstances['clip-1'])

// Try manual play
audioArchive.wavesurferInstances['clip-1'].play()
```

**Common Causes:**

1. Audio hasn't finished loading
   - Wait for "Loading audio..." to disappear
   - Check console for ✅ "Loaded" message

2. Browser autoplay policy
   - Modern browsers require user interaction before autoplay
   - Solution: Users must click Play button first (already implemented)

3. Button is disabled (red ❌ in UI)
   - Indicates audio failed to load
   - Fix the file path issue (see Issue 1)

---

### Issue 4: Waveform not displaying

**Console Check:**
```javascript
// Verify container exists
document.getElementById('waveform-clip-1')  // Should return element

// Verify WaveSurfer instance
audioArchive.wavesurferInstances['clip-1']  // Should show object
```

**Possible Fixes:**

1. CSS issue - waveform height too small
   ```css
   .waveform-player {
     height: 50px;  /* Increase if needed */
   }
   ```

2. WaveSurfer hasn't rendered yet
   ```javascript
   // Force redraw
   audioArchive.wavesurferInstances['clip-1'].drawer.canvases[0]?.addEventListener('error', e => {
     console.error('Canvas error:', e);
   });
   ```

---

## 🧪 Test Cases

### Test 1: Full Load Test
```javascript
// 1. Check all instances created
const count = Object.keys(audioArchive.wavesurferInstances).length;
console.log(`✅ Created ${count} audio instances`);

// 2. Check errors
if (audioArchive.loadErrors.length > 0) {
  console.error('❌ Failed files:', audioArchive.loadErrors);
} else {
  console.log('✅ All files loaded');
}

// 3. Test one play
audioArchive.togglePlay('clip-1');
setTimeout(() => {
  const isPlaying = audioArchive.wavesurferInstances['clip-1'].isPlaying();
  console.log('Playing:', isPlaying);
}, 500);
```

### Test 2: File Accessibility Test
```javascript
// Test each audio file
audioData.forEach(item => {
  fetch(item.audioUrl, { method: 'HEAD' })
    .then(r => console.log(`${r.ok ? '✅' : '❌'} ${item.id}: ${item.audioUrl}`))
    .catch(e => console.error(`❌ ${item.id}: ${e.message}`));
});
```

### Test 3: Filter Test
```javascript
// Test filtering
audioArchive.filterCategory('music', document.querySelector('[data-category="music"]'));
console.log('Visible cards:', document.querySelectorAll('.audio-card:not(.hidden)').length);
```

---

## 📋 File Upload Checklist

Before deploying, verify:

- [ ] `audio/` folder exists in root
- [ ] All audio files match filenames in `data.js` exactly (including spaces)
- [ ] All audio files are `.mp3` format
- [ ] File permissions allow reading by web server
- [ ] Server has correct MIME type: `audio/mpeg` for `.mp3`
- [ ] No special characters in filenames (except spaces and apostrophes)
- [ ] All 7 audio files are present:
  - `Wood cutters Radio Belize Introduction .mp3` (note trailing space)
  - `Wood cutters song 1 Bulldog nuh Bite Mi.mp3`
  - `Wood cutters song 2 .mp3` (note trailing space)
  - `Wood cutters song 3.mp3`
  - `Wood cutters song 4.mp3`
  - `Miss Floss' Freetown Gyal Sample.mp3`
  - `Folk Songs by Miss Floss' School.mp3`

---

## 🔧 Advanced Debugging

### Enable Verbose Logging
Edit `app.js` and add to constructor:
```javascript
// Add to constructor
window.DEBUG_MODE = true;

// Then in methods:
if (window.DEBUG_MODE) {
  console.group('AudioArchive.init()');
  console.log('Container:', this.container);
  console.log('WaveSurfer available:', typeof WaveSurfer);
  console.groupEnd();
}
```

### Monitor Network Activity
1. Open DevTools → Network tab
2. Filter by XHR/Fetch
3. Reload page
4. Look for failed requests (red text)
5. Check response headers for MIME type

### Inspect WaveSurfer Internals
```javascript
const ws = audioArchive.wavesurferInstances['clip-1'];

// Audio element
console.log(ws.media);

// Get duration
console.log('Duration:', ws.getDuration());

// Get current time
console.log('Current:', ws.getCurrentTime());

// Get backend type
console.log('Backend:', ws.backend?.constructor?.name);

// Check audio buffer
console.log('Channels:', ws.audioBuffer?.numberOfChannels);
```

---

## 📞 Still Having Issues?

1. **Check Browser Console** (F12) - copy all error messages
2. **Test in Different Browser** - Chrome, Firefox, Safari
3. **Check File Permissions** - can you download files manually?
4. **Run Diagnostic** - use Test Cases above
5. **Check Server Logs** - look for 404 or permission errors

---

## 🎯 Performance Tips

1. **Compress Audio** - Use MP3 compression to reduce file size
2. **Lazy Load** - Load WaveSurfer only when needed
3. **Cache Headers** - Set server cache headers for audio files
4. **CDN** - Host audio files on CDN for faster delivery

Example Cache Headers:
```
Cache-Control: public, max-age=31536000, immutable
Content-Type: audio/mpeg
```
