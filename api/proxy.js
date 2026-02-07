export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  try {
    // Get the target path from query
    const targetPath = req.query.target;
    
    if (!targetPath) {
      return res.status(400).json({ error: 'Missing target path' });
    }

    // Build the full URL with remaining query params
    const { target, ...otherParams } = req.query;
    const queryString = Object.keys(otherParams).length > 0 
      ? '?' + new URLSearchParams(otherParams).toString()
      : '';
    
    const targetUrl = `https://webapi.moi.gov.eg${targetPath}${queryString}`;
    
    // Build headers
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
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
}
