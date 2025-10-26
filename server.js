const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Serve static files from reports directory
app.use('/reports', express.static('reports'));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'Unlighthouse Service Running',
    usage: 'POST to /scan with { "url": "https://example.com" }'
  });
});

// Scan endpoint
app.post('/scan', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Generate unique ID for this scan
  const scanId = Date.now().toString();
  const outputPath = path.join(__dirname, 'reports', scanId);

  console.log(`Starting scan for: ${url}`);

  // Run Unlighthouse
  const command = `npx @unlighthouse/cli --site ${url} --build-static --output-path ${outputPath}`;

  exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).json({ 
        error: 'Scan failed', 
        details: error.message 
      });
    }

    console.log(`Scan completed for: ${url}`);

    // Return the report URL
    const reportUrl = `${req.protocol}://${req.get('host')}/reports/${scanId}/index.html`;
    
    res.json({
      success: true,
      scanId: scanId,
      reportUrl: reportUrl,
      message: 'Scan completed successfully'
    });
  });
});

// Create reports directory if it doesn't exist
if (!fs.existsSync('reports')) {
  fs.mkdirSync('reports');
}

app.listen(PORT, () => {
  console.log(`Unlighthouse service running on port ${PORT}`);
});
