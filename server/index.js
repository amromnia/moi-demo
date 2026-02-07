import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.MMM_PORT || 3000;
const MOI_API_BASE = 'https://webapi.moi.gov.eg';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

// Serve static files from dist folder (Vite build output)
app.use(express.static(join(__dirname, '../dist')));

// Token endpoint - proxy to MOI token endpoint
app.all('/token', async (req, res) => {
  try {
    const response = await fetch(`${MOI_API_BASE}/token`, {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/x-www-form-urlencoded',
      },
      body: req.method !== 'GET' ? (typeof req.body === 'string' ? req.body : new URLSearchParams(req.body).toString()) : undefined,
    });

    const data = await response.text();
    
    res.status(response.status);
    
    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch {
      res.send(data);
    }
  } catch (error) {
    console.error('Token endpoint error:', error);
    res.status(500).json({ error: 'Token endpoint error', message: error.message });
  }
});

// Proxy endpoint - flexible proxy with target query param
app.all('/api/proxy', async (req, res) => {
  try {
    const targetPath = req.query.target;
    
    if (!targetPath) {
      return res.status(400).json({ error: 'Missing target path' });
    }

    const { target, ...otherParams } = req.query;
    const queryString = Object.keys(otherParams).length > 0 
      ? '?' + new URLSearchParams(otherParams).toString()
      : '';
    
    const targetUrl = `${MOI_API_BASE}${targetPath}${queryString}`;
    
    console.log('Proxying to:', targetUrl);
    console.log('Method:', req.method);

    const headers = {};
    
    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'];
    } else if (req.method !== 'GET' && req.method !== 'HEAD') {
      headers['Content-Type'] = 'application/json';
    }
    
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    const fetchOptions = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (typeof req.body === 'string') {
        fetchOptions.body = req.body;
      } else if (req.body && Object.keys(req.body).length > 0) {
        fetchOptions.body = JSON.stringify(req.body);
      }
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.text();
    
    console.log('Response status:', response.status);
    
    res.status(response.status);
    
    if (data) {
      try {
        const jsonData = JSON.parse(data);
        res.json(jsonData);
      } catch {
        res.send(data);
      }
    } else {
      res.end();
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
});

// Catch-all for /api/* routes - proxy directly to MOI API
app.all('/api/*', async (req, res) => {
  try {
    const apiPath = req.path.replace('/api/', '');
    
    const queryString = Object.keys(req.query).length > 0 
      ? '?' + new URLSearchParams(req.query).toString()
      : '';
    
    const targetUrl = `${MOI_API_BASE}/api/${apiPath}${queryString}`;
    
    console.log('Proxying to:', targetUrl);
    console.log('Method:', req.method);

    const headers = {};
    
    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'];
    } else if (req.method !== 'GET' && req.method !== 'HEAD') {
      headers['Content-Type'] = 'application/json';
    }
    
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    const fetchOptions = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (typeof req.body === 'string') {
        fetchOptions.body = req.body;
      } else if (req.body && Object.keys(req.body).length > 0) {
        fetchOptions.body = JSON.stringify(req.body);
      }
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.text();
    
    console.log('Response status:', response.status);
    
    res.status(response.status);
    
    if (data) {
      try {
        const jsonData = JSON.parse(data);
        res.json(jsonData);
      } catch {
        res.send(data);
      }
    } else {
      res.end();
    }
  } catch (error) {
    console.error('API proxy error:', error);
    res.status(500).json({ error: 'API proxy error', message: error.message });
  }
});

// Serve index.html for all other routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Proxying requests to ${MOI_API_BASE}`);
});
