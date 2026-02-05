export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  try {
    // Get the path segments after /api/
    const { path } = req.query;
    const apiPath = Array.isArray(path) ? path.join('/') : path;
    const targetUrl = `https://webapi.moi.gov.eg/api/${apiPath}`;
    
    console.log('Proxying to:', targetUrl);

    // Build headers
    const headers = {
      'Content-Type': req.headers['content-type'] || 'application/json',
    };
    
    // Forward Authorization header if present
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    // Build fetch options
    const fetchOptions = {
      method: req.method,
      headers,
    };

    // Add body for non-GET requests
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (typeof req.body === 'string') {
        fetchOptions.body = req.body;
      } else if (req.body) {
        fetchOptions.body = JSON.stringify(req.body);
      }
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.text();
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Forward the response status
    res.status(response.status);
    
    // Try to parse as JSON, otherwise send as text
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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
}
