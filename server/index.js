import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Detect environment: development or production
const isDevelopment = process.env.NODE_ENV === 'development';

const app = express();
const PORT = process.env.MMM_PORT || (isDevelopment ? 3001 : 3000);
const MOI_API_BASE = 'https://webapi.moi.gov.eg';

// Feature flag: set to 'false' to completely disable traffic sync
const ENABLE_TRAFFIC_SYNC = process.env.ENABLE_TRAFFIC_SYNC !== 'false';

// Environment-specific CORS configuration
if (isDevelopment) {
  // Development: Allow only Vite dev server
  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
  }));
} else {
  // Production: Allow all origins
  app.use(cors());
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

// Production: Serve static files from dist folder (Vite build output)
if (!isDevelopment) {
  app.use(express.static(join(__dirname, '../dist')));
}

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

// Traffic service sync endpoint - using kiosk registration API
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
    const { memberId, accessToken } = req.body;

    // Validate required fields
    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: 'معرف العضو مطلوب',
        error: 'memberId is required'
      });
    }

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'رمز المصادقة مطلوب',
        error: 'accessToken is required'
      });
    }

    // Check environment variables
    const baseUrl = process.env.TRAFFIC_SYNC_BASE_URL;
    const username = process.env.TRAFFIC_SYNC_USERNAME;
    const password = process.env.TRAFFIC_SYNC_PASSWORD;

    if (!baseUrl || !username || !password) {
      console.error('Missing environment variables:', {
        hasBaseUrl: !!baseUrl,
        hasUsername: !!username,
        hasPassword: !!password
      });
      return res.status(500).json({
        success: false,
        message: 'خطأ في إعدادات الخادم',
        error: 'Missing environment variables for traffic sync'
      });
    }

    // Step 1: Get user profile data from MOI API
    console.log('Step 1: Fetching user profile from MOI API...');
    const profileResponse = await fetch(
      `${MOI_API_BASE}/api/MoiProfileApi/GetProfile?memberId=${memberId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    if (!profileResponse.ok) {
      console.error('Failed to fetch user profile:', profileResponse.status);
      
      // Handle token expiration
      if (profileResponse.status === 401) {
        return res.status(401).json({
          success: false,
          message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى',
          error: 'Token expired or invalid',
          sessionExpired: true
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'فشل الحصول على بيانات المستخدم',
        error: `Profile API returned status ${profileResponse.status}`
      });
    }

    const profileData = await profileResponse.json();

    if (profileData.status !== 1 || !profileData.data) {
      console.error('Invalid profile data:', profileData);
      return res.status(500).json({
        success: false,
        message: profileData.message || 'بيانات المستخدم غير صالحة',
        error: 'Invalid profile response'
      });
    }

    const profile = profileData.data;

    // Extract required fields
    const fullName = profile.fullName || profile.FullName || '';
    const mobileNumber = profile.mobile || profile.Mobile || '';
    const nationalId = profile.cardId || profile.NationalId || profile.PassportNumber || '';
    const email = profile.email || profile.Email || '';

    // Validate extracted data
    if (!fullName) {
      return res.status(400).json({
        success: false,
        message: 'الاسم الكامل غير موجود في ملف المستخدم',
        error: 'Full name not found in profile'
      });
    }

    if (!mobileNumber) {
      return res.status(400).json({
        success: false,
        message: 'رقم الهاتف غير موجود في ملف المستخدم',
        error: 'Mobile number not found in profile'
      });
    }

    if (!nationalId) {
      return res.status(400).json({
        success: false,
        message: 'رقم الهوية غير موجود في ملف المستخدم',
        error: 'National ID not found in profile'
      });
    }

    // Validate national ID format (must be exactly 14 digits)
    if (!/^\d{14}$/.test(nationalId)) {
      return res.status(400).json({
        success: false,
        message: 'رقم الهوية يجب أن يكون 14 رقماً بالضبط',
        error: 'National ID must be exactly 14 digits'
      });
    }

    // Validate mobile number format (must be 11 digits starting with 010, 011, 012, or 015)
    if (!/^(010|011|012|015)\d{8}$/.test(mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: 'رقم الهاتف غير صالح. يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015 ويكون 11 رقماً',
        error: 'Mobile number must be 11 digits starting with 010, 011, 012, or 015'
      });
    }

    // Step 2: Authenticate with kiosk service
    console.log('Step 2: Authenticating with kiosk service...');
    const authResponse = await fetch(`${baseUrl}/api/Auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    });

    if (!authResponse.ok) {
      console.error('Kiosk authentication failed:', authResponse.status);
      return res.status(500).json({
        success: false,
        message: 'فشل المصادقة مع خدمة المرور',
        error: `Authentication failed with status ${authResponse.status}`,
        step: 'authentication'
      });
    }

    const authData = await authResponse.json();

    // Check for successful authentication (statusCode: 0 = SUCCESS)
    if (authData.statusCode !== 0 || !authData.success || !authData.result?.token) {
      console.error('Invalid authentication response:', authData);
      return res.status(500).json({
        success: false,
        message: authData.message || 'فشل الحصول على رمز المصادقة',
        error: 'Invalid authentication response',
        step: 'authentication'
      });
    }

    const token = authData.result.token;

    // Step 3: Register/update user in kiosk service
    console.log('Step 3: Registering user with kiosk service...');
    const registerResponse = await fetch(`${baseUrl}/api/User/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        fullName: fullName,
        mobileNumber: mobileNumber,
        nationalId: `${nationalId}`, // Ensure it's a string
        email: email || undefined // Only include email if it exists
      })
    });

    if (!registerResponse.ok) {
      console.error('User registration failed:', registerResponse.status);
      const errorText = await registerResponse.text();
      console.error('Registration error response:', errorText);
      
      return res.status(500).json({
        success: false,
        message: 'فشل تسجيل المستخدم في خدمة المرور',
        error: `Registration failed with status ${registerResponse.status}`,
        details: errorText,
        step: 'registration'
      });
    }

    const registerData = await registerResponse.json();

    // Check registration result
    if (registerData.statusCode === 0 && registerData.success) {
      // Success
      console.log('User registered successfully');
      return res.status(200).json({
        success: true,
        message: 'تم التسجيل بنجاح في خدمة المرور'
      });
    } else if (registerData.statusCode === 4000) {
      // Validation error
      console.error('Validation error:', registerData);
      return res.status(400).json({
        success: false,
        message: registerData.message || 'خطأ في التحقق من البيانات',
        error: 'Validation error',
        step: 'registration'
      });
    } else if (registerData.statusCode === 4001) {
      // Authorization error
      console.error('Authorization error:', registerData);
      return res.status(401).json({
        success: false,
        message: registerData.message || 'خطأ في المصادقة',
        error: 'Authorization error',
        step: 'registration'
      });
    } else {
      // Other error
      console.error('Registration failed:', registerData);
      return res.status(500).json({
        success: false,
        message: registerData.message || 'فشل التسجيل في خدمة المرور',
        error: 'Registration failed',
        step: 'registration'
      });
    }

  } catch (error) {
    console.error('Traffic sync error:', error);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ غير متوقع',
      error: error.message
    });
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
    console.error('API proxy error:', error);
    res.status(500).json({ error: 'API proxy error', message: error.message });
  }
});

// Production: Serve index.html for all other routes (SPA fallback)
if (!isDevelopment) {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, () => {
  if (isDevelopment) {
    console.log(`Dev API server running on http://localhost:${PORT}`);
    console.log(`Traffic sync: ${ENABLE_TRAFFIC_SYNC ? 'ENABLED' : 'DISABLED'}`);
    console.log(`Configure your Vite dev server to proxy to this port`);
  } else {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Traffic sync: ${ENABLE_TRAFFIC_SYNC ? 'ENABLED' : 'DISABLED'}`);
  }
});
