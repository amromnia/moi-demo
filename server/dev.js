import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.MMM_PORT || 3001;
const MOI_API_BASE = 'https://webapi.moi.gov.eg';

// Feature flag: set to 'false' to completely disable traffic sync
const ENABLE_TRAFFIC_SYNC = process.env.ENABLE_TRAFFIC_SYNC !== 'false';

// Allow CORS from Vite dev server
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

// Token endpoint
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

// Proxy endpoint
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

// Traffic service sync endpoint
app.post('/api/traffic-sync', async (req, res) => {
  // Check if traffic sync is enabled
  if (!ENABLE_TRAFFIC_SYNC) {
    console.log('Traffic sync is disabled via ENABLE_TRAFFIC_SYNC flag');
    return res.status(200).json({ 
      success: false,
      message: 'خدمة المزامنة مع المرور معطلة حالياً',
      disabled: true
    });
  }

  try {
    const { email, token, nationalityType, nationalId } = req.body;
    
    if (!email || !token || nationalityType === undefined || nationalityType === null || !nationalId) {
      console.error('Missing required fields:', { email: !!email, token: !!token, nationalityType, nationalId: !!nationalId });
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields',
        required: ['email', 'token', 'nationalityType', 'nationalId']
      });
    }

    if (typeof token !== 'string') {
      console.error('Invalid token format:', { type: typeof token, length: token?.length });
      return res.status(400).json({ 
        success: false,
        error: 'Invalid token format',
        message: 'رمز المصادقة غير صالح'
      });
    }

    const TRAFFIC_BASE = 'https://traffic.moi.gov.eg';
    const referer = `${TRAFFIC_BASE}/Arabic/Pages/default.aspx?Email=${encodeURIComponent(email)}&Token=${encodeURIComponent(token)}`;
    
    // Common headers for all requests
    const commonHeaders = {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
      'Content-Type': 'application/json',
      'Origin': TRAFFIC_BASE,
      'Referer': referer,
      'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
      'X-Requested-With': 'XMLHttpRequest'
    };

    // Step 1: ValidateUserLogin
    const step1Body = { Email: email, Token: token };
    const step1Response = await fetch(`${TRAFFIC_BASE}/Api/api/ExternalLogin/ValidateUserLogin`, {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify(step1Body)
    });

    const step1Text = await step1Response.text();

    if (!step1Response.ok) {
      console.error('Step 1 failed:', step1Response.status, step1Text);
      return res.status(200).json({ 
        success: false,
        step: 'ValidateUserLogin',
        status: step1Response.status,
        message: 'فشل التحقق من بيانات المستخدم',
        details: step1Text
      });
    }

    // Step 2: ClaimSharePointUserLogin
    const step2Response = await fetch(`${TRAFFIC_BASE}/_layouts/15/LINKDev.Traffic/ExternalLogin.aspx/ClaimSharePointUserLogin`, {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify({ email: email })
    });

    const step2Text = await step2Response.text();

    if (!step2Response.ok) {
      console.error('Step 2 failed:', step2Response.status, step2Text);
      return res.status(200).json({ 
        success: false,
        step: 'ClaimSharePointUserLogin',
        status: step2Response.status,
        message: 'فشل المصادقة مع SharePoint',
        details: step2Text
      });
    }

    // Step 3: ContinueValidateUserLogin
    const step3Response = await fetch(`${TRAFFIC_BASE}/Api/api/ExternalLogin/ContinueValidateUserLogin`, {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify({ 
        NationalityType: nationalityType,
        NationalId: nationalId 
      })
    });

    const step3Text = await step3Response.text();

    if (!step3Response.ok) {
      console.error('Step 3 failed:', step3Response.status, step3Text);
      return res.status(200).json({ 
        success: false,
        step: 'ContinueValidateUserLogin',
        status: step3Response.status,
        message: 'فشل إكمال عملية التحقق',
        details: step3Text
      });
    }

    res.json({ 
      success: true,
      message: 'تمت المزامنة مع خدمة المرور بنجاح'
    });

  } catch (error) {
    console.error('Traffic sync error:', error);
    res.status(200).json({ 
      success: false,
      error: 'Traffic sync error',
      message: 'حدث خطأ أثناء المزامنة مع خدمة المرور',
      details: error.message
    });
  }
});

// Catch-all for /api/* routes
app.all('/api/*', async (req, res) => {
  try {
    const apiPath = req.path.replace('/api/', '');
    
    const queryString = Object.keys(req.query).length > 0 
      ? '?' + new URLSearchParams(req.query).toString()
      : '';
    
    const targetUrl = `${MOI_API_BASE}/api/${apiPath}${queryString}`;
    

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

app.listen(PORT, () => {
  console.log(`Dev API server running on http://localhost:${PORT}`);
  console.log(`Traffic sync: ${ENABLE_TRAFFIC_SYNC ? 'ENABLED' : 'DISABLED'}`);
  console.log(`Configure your Vite dev server to proxy to this port`);
});
