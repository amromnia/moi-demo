/**
 * Build the API URL - always uses the Express server proxy
 * @param {string} path - The API path (e.g., '/api/MoiProfileApi/GetProfile')
 * @param {object} params - Query parameters object
 * @returns {string} The full URL to call
 */
function buildApiUrl(path, params = {}) {
  // Use the proxy endpoint with target parameter
  const allParams = { target: path, ...params };
  return `/api/proxy?${new URLSearchParams(allParams).toString()}`;
}

/**
 * Login user
 * @param {string} username - Username or mobile number
 * @param {string} password - User password
 * @returns {Promise<{success: boolean, data?: object, message?: string}>}
 */
export async function login(username, password) {
  console.log('Attempting login with username:', username);
  const formData = new URLSearchParams();
  formData.append('userName', username);
  formData.append('password', password);
  formData.append('grant_type', 'password');

  try {
    const response = await fetch('/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });

    const text = await response.text();

    if (response.ok) {
      // Check if response is empty
      if (!text || text.trim() === '') {
        console.error('Empty response from server');
        return { 
          success: false, 
          message: 'استجابة فارغة من الخادم' 
        };
      }

      try {
        const data = JSON.parse(text);
        
        // Validate required fields
        if (!data.access_token || !data.MemberId) {
          console.error('Invalid login response - missing required fields:', data);
          return { 
            success: false, 
            message: 'استجابة غير صحيحة من الخادم' 
          };
        }

        // Store token and user info synchronously
        try {
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('memberId', data.MemberId);
          localStorage.setItem('fullName', data.FullName || '');
          localStorage.setItem('email', data.Email || '');
          localStorage.setItem('isCitizen', data.IsCitizen || 'False');
          
          // Verify storage worked
          const storedToken = localStorage.getItem('access_token');
          if (!storedToken) {
            console.error('Failed to store token in localStorage');
            return { 
              success: false, 
              message: 'فشل حفظ بيانات الجلسة' 
            };
          }
          
          return { success: true, data };
        } catch (storageError) {
          console.error('localStorage error:', storageError);
          return { 
            success: false, 
            message: 'فشل حفظ بيانات الجلسة' 
          };
        }
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError, 'Response text:', text);
        return { 
          success: false, 
          message: 'خطأ في تحليل البيانات من الخادم' 
        };
      }
    } else {
      try {
        const error = JSON.parse(text);
        return { 
          success: false, 
          message: error.error_description || 'فشل تسجيل الدخول' 
        };
      } catch {
        return { 
          success: false, 
          message: text || 'فشل تسجيل الدخول' 
        };
      }
    }
  } catch (error) {
    console.error('Login error:', error);
    return { 
      success: false, 
      message: 'حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى' 
    };
  }
}

/**
 * Get list of nationalities
 * @returns {Promise<{success: boolean, data?: array, message?: string}>}
 */
export async function getNationalities() {
  try {
    const response = await fetch(
      buildApiUrl('/api/MoiMasterDataApi/GetNationalities'),
      { 
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      return { 
        success: false, 
        message: `HTTP error! status: ${response.status}` 
      };
    }

    const text = await response.text();
    
    // Check if response is empty
    if (!text || text.trim() === '') {
      return { 
        success: false, 
        message: 'استجابة فارغة من الخادم' 
      };
    }

    try {
      const result = JSON.parse(text);
      
      if (result.status === 1) {
        return { success: true, data: result.data };
      } else {
        return { 
          success: false, 
          message: result.message || 'فشل تحميل قائمة الجنسيات' 
        };
      }
    } catch (jsonError) {
      console.error('JSON parse error:', jsonError, 'Response text:', text);
      return { 
        success: false, 
        message: 'خطأ في تحليل البيانات من الخادم' 
      };
    }
  } catch (error) {
    console.error('Get nationalities error:', error);
    return { 
      success: false, 
      message: 'حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى' 
    };
  }
}

/**
 * Get list of governorates (for Egyptian citizens)
 * @returns {Promise<{success: boolean, data?: array, message?: string}>}
 */
export async function getGovernorates() {
  try {
    const response = await fetch(
      buildApiUrl('/api/MoiMasterDataApi/GetGovernorates'),
      { 
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      return { 
        success: false, 
        message: `HTTP error! status: ${response.status}` 
      };
    }

    const text = await response.text();
    
    // Check if response is empty
    if (!text || text.trim() === '') {
      return { 
        success: false, 
        message: 'استجابة فارغة من الخادم' 
      };
    }

    try {
      const result = JSON.parse(text);
      
      if (result.status === 1) {
        return { success: true, data: result.data };
      } else {
        return { 
          success: false, 
          message: result.message || 'فشل تحميل قائمة المحافظات' 
        };
      }
    } catch (jsonError) {
      console.error('JSON parse error:', jsonError, 'Response text:', text);
      return { 
        success: false, 
        message: 'خطأ في تحليل البيانات من الخادم' 
      };
    }
  } catch (error) {
    console.error('Get governorates error:', error);
    return { 
      success: false, 
      message: 'حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى' 
    };
  }
}

/**
 * Register Egyptian citizen
 * @param {object} userData - User registration data
 * @returns {Promise<{success: boolean, data?: object, message?: string}>}
 */
export async function registerCitizen(userData) {
  const payload = {
    FullName: userData.fullName,
    Email: userData.email,
    Mobile: userData.mobile,
    Password: userData.password,
    ConfirmPassword: userData.confirmPassword,
    cardId: userData.cardId,
    CardFactoryNumber: userData.cardFactoryNumber,
    MotherFirstName: userData.motherFirstName,
    Address: userData.address,
    JobTitle: userData.jobTitle,
    GovernorateId: parseInt(userData.governorateId)
  };

  try {
    const response = await fetch(
      buildApiUrl('/api/mobile_memberApi/RegisterCitizen'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      }
    );

    const result = await response.json();
    
    if (result.status === 1) {
      return { 
        success: true, 
        data: result.data,
        message: result.message 
      };
    } else {
      return { 
        success: false, 
        message: result.message || 'فشل التسجيل' 
      };
    }
  } catch (error) {
    console.error('Register citizen error:', error);
    return { 
      success: false, 
      message: 'حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى' 
    };
  }
}

/**
 * Register foreigner
 * @param {object} userData - User registration data
 * @returns {Promise<{success: boolean, data?: object, message?: string}>}
 */
export async function registerForeigner(userData) {
  const payload = {
    FullName: userData.fullName,
    Email: userData.email,
    Mobile: userData.mobile,
    Password: userData.password,
    ConfirmPassword: userData.confirmPassword,
    NationalityId: parseInt(userData.nationalityId),
    PassportNumber: userData.passportNumber,
    Address: userData.address,
    JobTitle: userData.jobTitle
  };

  try {
    const response = await fetch(
      buildApiUrl('/api/mobile_memberApi/RegisterForeigner'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      }
    );

    const result = await response.json();
    
    if (result.status === 1) {
      return { 
        success: true, 
        data: result.data,
        message: result.message 
      };
    } else {
      return { 
        success: false, 
        message: result.message || 'فشل التسجيل' 
      };
    }
  } catch (error) {
    console.error('Register foreigner error:', error);
    return { 
      success: false, 
      message: 'حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى' 
    };
  }
}

/**
 * Logout user
 */
export function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('memberId');
  localStorage.removeItem('fullName');
  localStorage.removeItem('email');
  localStorage.removeItem('isCitizen');
}

/**
 * Check if user is logged in
 * @returns {boolean}
 */
export function isLoggedIn() {
  const token = localStorage.getItem('access_token');
  return !!token;
}

/**
 * Get current user info
 * @returns {object|null}
 */
export function getCurrentUser() {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    return null;
  }
  
  const user = {
    memberId: localStorage.getItem('memberId'),
    fullName: localStorage.getItem('fullName'),
    isCitizen: localStorage.getItem('isCitizen') === 'True',
    email: localStorage.getItem('email')
  };
  
  return user;
}

/**
 * Activate account by SMS code
 * @param {string} memberId - User's member ID from registration
 * @param {string} mobile - User's mobile number
 * @param {string} code - 4-digit activation code from SMS
 * @returns {Promise<{success: boolean, data?: object, message?: string}>}
 */
export async function activateAccountBySMS(memberId, mobile, code) {
  const payload = {
    memberId: memberId,
    mobile: mobile,
    code: code
  };

  try {
    const response = await fetch(
      buildApiUrl('/api/mobile_memberApi/ActivateBySMS'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      }
    );

    const result = await response.json();
    
    if (result.status === 1) {
      // Activation successful - user is now logged in
      const loginData = result.data;
      
      // Store authentication data
      localStorage.setItem('access_token', loginData.access_token);
      localStorage.setItem('memberId', loginData.MemberId);
      localStorage.setItem('fullName', loginData.FullName);
      localStorage.setItem('email', loginData.Email);
      localStorage.setItem('isCitizen', loginData.IsCitizen);
      
      return { 
        success: true, 
        message: result.message,
        data: loginData
      };
    } else {
      return { 
        success: false, 
        message: result.message || 'فشل التفعيل' 
      };
    }
  } catch (error) {
    console.error('Activation error:', error);
    return { 
      success: false, 
      message: 'حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى' 
    };
  }
}

/**
 * Get user profile (requires authentication)
 * @param {string} memberId - User's member ID
 * @returns {Promise<{success: boolean, data?: object, message?: string}>}
 */
export async function getUserProfile(memberId) {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    return { success: false, message: 'غير مصرح لك بالوصول' };
  }

  try {
    const response = await fetch(
      buildApiUrl('/api/MoiProfileApi/GetProfile', { memberId }),
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Handle token expiration
    if (response.status === 401) {
      logout();
      return { 
        success: false, 
        message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى',
        sessionExpired: true
      };
    }

    const result = await response.json();
    
    if (result.status === 1) {
      return { 
        success: true, 
        data: result.data
      };
    } else {
      return { 
        success: false, 
        message: result.message || 'فشل تحميل الملف الشخصي' 
      };
    }
  } catch (error) {
    console.error('Get profile error:', error);
    return { 
      success: false, 
      message: 'حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى' 
    };
  }
}

/**
 * Request password reset
 * @param {string} email - User's email
 * @param {string} cardIdOrPassport - National ID or Passport number
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function requestPasswordReset(email, cardIdOrPassport) {
  const payload = {
    Email: email,
    CardIdOrPassport: cardIdOrPassport
  };

  try {
    const response = await fetch(
      buildApiUrl('/api/mobile_memberApi/RequestForgetPassword'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      }
    );

    const result = await response.json();
    
    if (result.status === 1) {
      return { 
        success: true, 
        message: result.message || 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني'
      };
    } else {
      return { 
        success: false, 
        message: result.message || 'فشل إرسال البريد الإلكتروني' 
      };
    }
  } catch (error) {
    console.error('Password reset error:', error);
    return { 
      success: false, 
      message: 'حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى' 
    };
  }
}
