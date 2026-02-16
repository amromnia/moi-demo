/**
 * Traffic Sync API Route
 * 
 * This endpoint syncs user data with the external kiosk registration service.
 * Flow:
 * 1. Get user profile data from MOI API
 * 2. Authenticate with kiosk service using credentials
 * 3. Register/update user in kiosk service
 * 
 * Environment Variables Required:
 * - TRAFFIC_SYNC_BASE_URL: Base URL for the kiosk service
 * - TRAFFIC_SYNC_USERNAME: Username for kiosk service authentication
 * - TRAFFIC_SYNC_PASSWORD: Password for kiosk service authentication
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
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
      `https://webapi.moi.gov.eg/api/MoiProfileApi/GetProfile?memberId=${memberId}`,
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
        nationalId: nationalId,
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
}
