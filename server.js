const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

// Serve static files from reports directory
app.use('/reports', express.static('reports'));

// Store scan status
const scans = {};

// Serve the UI
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API: Start scan
app.post('/api/scan', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const scanId = Date.now().toString();
  const outputPath = path.join(__dirname, 'reports', scanId);

  // Store scan status
  scans[scanId] = {
    url: url,
    status: 'running',
    startTime: new Date(),
    reportUrl: null
  };

  console.log('Starting scan ' + scanId + ' for: ' + url);

  // Return immediately with scan ID
  res.json({
    success: true,
    scanId: scanId,
    message: 'Scan started',
    statusUrl: '/api/status/' + scanId
  });

  // Run scan in background
  const command = 'npx @unlighthouse/cli --site "' + url + '" --build-static --output-path "' + outputPath + '"';

  exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    if (error) {
      console.error('Scan ' + scanId + ' failed: ' + error.message);
      scans[scanId].status = 'failed';
      scans[scanId].error = error.message;
      return;
    }

    console.log('Scan ' + scanId + ' completed');
    scans[scanId].status = 'completed';
    scans[scanId].reportUrl = '/reports/' + scanId + '/index.html';
    scans[scanId].endTime = new Date();
  });
});

// API: Check scan status
app.get('/api/status/:scanId', (req, res) => {
  const { scanId } = req.params;
  const scan = scans[scanId];

  if (!scan) {
    return res.status(404).json({ error: 'Scan not found' });
  }

  res.json(scan);
});

// API: List all scans
app.get('/api/scans', (req, res) => {
  const scanList = Object.keys(scans).map(id => ({
    scanId: id,
    ...scans[id]
  })).reverse();

  res.json(scanList);
});

// Create required directories
if (!fs.existsSync('reports')) {
  fs.mkdirSync('reports');
}
if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

app.listen(PORT, () => {
  console.log('Unlighthouse service running on port ' + PORT);
});
