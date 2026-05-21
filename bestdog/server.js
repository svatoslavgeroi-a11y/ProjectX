const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Root is the parent directory of bestdog (ProgectX)
const rootDir = path.join(__dirname, '..');

// Serve static files from rootDir
app.use(express.static(rootDir));

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(rootDir, 'index.html'));
});

// Serve bestdog index.html for /bestdog or /bestdog/
app.get('/bestdog', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log('\n=========================================');
    console.log('🪐 PROGECTX MULTIVERSE HUB IS ONLINE!');
    console.log(`👉 http://localhost:${PORT}`);
    console.log('=========================================');
    console.log(`🐕 BestDog Game:      http://localhost:${PORT}/bestdog/`);
    console.log(`🎵 SpotifyAnalyzer:   http://localhost:${PORT}/SpotifyAnalyzer/spotify_analysis.html`);
    console.log(`📝 EnglishSub:        http://localhost:${PORT}/EnglishSub/index.html`);
    console.log('=========================================\n');
});
