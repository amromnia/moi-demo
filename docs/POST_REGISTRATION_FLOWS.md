#  API - Post-Registration & Account Management Flows
## SMS Activation, Profile Management, and Password Recovery

---

## Table of Contents
1. [SMS Activation Flow](#sms-activation-flow)
2. [Get User Profile](#get-user-profile)
3. [Password Recovery Flow](#password-recovery-flow)
4. [Complete Post-Registration Journey](#complete-post-registration-journey)

---

## SMS Activation Flow

After a user completes registration (either as Citizen or Foreigner), they receive an SMS with a 4-digit activation code. The account must be activated before the user can login.

### 1. Activate Account by SMS

**Endpoint:** `POST /api/mobile_memberApi/ActivateBySMS`

**Content-Type:** `application/json`

**When to Call:** After user registration, when user enters the 4-digit code received via SMS

**Request Body:**
```json
{
  "memberId": "67890",
  "mobile": "01012345678",
  "code": "1234"
}
```

**Field Descriptions:**
- `memberId`: User's member ID returned from registration response
- `mobile`: User's mobile number (11 digits starting with 01)
- `code`: 4-digit activation code received via SMS

**Success Response (200 OK):**
```json
{
  "status": 1,
  "message": "تم تفعيل الحساب بنجاح",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 1209599,
    "FullName": "أحمد محمد علي",
    "MemberId": "67890",
    "Email": "ahmed@example.com",
    "IsCitizen": "True",
    "Hash": "abc123def456",
    "HashExpiry": "30",
    ".issued": "Thu, 05 Feb 2026 11:04:29 GMT",
    ".expires": "Thu, 19 Feb 2026 11:04:29 GMT"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "status": 0,
  "message": "كود التفعيل غير صحيح",
  "data": null
}
```

**Common Error Messages:**
- "كود التفعيل غير صحيح" - Activation code is incorrect
- "انتهت صلاحية الكود" - Code has expired
- "الحساب مفعل بالفعل" - Account is already activated
- "رقم الموبايل غير صحيح" - Mobile number is incorrect

**Implementation Notes:**
- Upon successful activation, the response includes a **login token** (same format as login endpoint)
- User is automatically logged in after activation
- Store the `access_token` and user data from the response
- Navigate user to the main dashboard/home screen
- No need to call login endpoint separately

**UI Flow:**
```
[Activation Code Screen]
- Display 4 input boxes for 4-digit code
- Auto-focus next box when user types a digit
- "Resend Code" button (see below)
- "Activate" button
  ↓
[User enters code: 1 2 3 4]
  ↓
[Submit] → POST /api/mobile_memberApi/ActivateBySMS
  ↓
IF status == 1:
  Store access_token, MemberId, FullName, etc.
  Navigate to Dashboard/Home
  Display: "تم تفعيل حسابك بنجاح"
ELSE:
  Display error from response.message
  Keep user on activation screen
  Highlight code input boxes
```

---

### 2. Resend Activation Code (Optional)

**Note:** The decompiled APK shows there is likely a "Resend Code" feature, but the specific endpoint was not fully documented in the analyzed code. Based on common patterns, it would likely be:

**Potential Endpoint:** `POST /api/mobile_memberApi/ResendActivationCode`

**Request Body (Inferred):**
```json
{
  "memberId": "67890",
  "mobile": "01012345678"
}
```

**Implementation Recommendation:**
- Add a "Resend Code" button with a cooldown timer (e.g., 60 seconds)
- Show countdown: "إعادة الإرسال (59 ثانية)"
- After cooldown, button becomes active
- On success, display: "تم إرسال الكود مرة أخرى"

---

## Get User Profile

Retrieve the logged-in user's profile information. This endpoint requires authentication.

### 3. Get Profile

**Endpoint:** `GET /api/MoiProfileApi/GetProfile`

**Method:** GET with Query Parameter

**Authentication:** Required - Include Bearer token in Authorization header

**Request:**
```
GET /api/MoiProfileApi/GetProfile?memberId=67890
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `memberId` (required): The user's member ID (from login/activation response)

**Success Response (200 OK):**
```json
{
  "status": 1,
  "message": null,
  "data": {
    "memberId": "67890",
    "fullName": "أحمد محمد علي السيد",
    "email": "ahmed@example.com",
    "mobile": "01012345678",
    "cardId": 12345678901234,
    "cardFactoryNumber": "123456789",
    "motherFirstName": "فاطمة",
    "address": "123 شارع النيل، القاهرة",
    "jobTitle": "مهندس برمجيات",
    "governorateId": 1040,
    "governorateName": "القاهـــرة",
    "password": null,
    "confirmPassword": null
  }
}
```

**For Foreigners (Non-Egyptian):**
```json
{
  "status": 1,
  "message": null,
  "data": {
    "memberId": "67891",
    "fullName": "John Michael Smith",
    "email": "john@example.com",
    "mobile": "01012345678",
    "passportNumber": "AB1234567",
    "nationalityId": 3025,
    "nationalityName": "الولايات المتحده الامريكيه",
    "address": "456 Nile Street, Cairo",
    "jobTitle": "Software Engineer",
    "password": null,
    "confirmPassword": null
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "status": 0,
  "message": "غير مصرح لك بالوصول",
  "data": null
}
```

**Error Response (404 Not Found):**
```json
{
  "status": 0,
  "message": "المستخدم غير موجود",
  "data": null
}
```

**Implementation Notes:**
- Call this endpoint when user navigates to "My Profile" screen
- Display user information in read-only or editable fields
- `password` and `confirmPassword` fields are always null for security
- Use `memberId` from localStorage (stored during login/activation)
- Include `Authorization: Bearer <token>` header with every request

**When to Call:**
- User opens "My Profile" page
- After updating profile (to refresh data)
- On app startup to sync user data

---

## Password Recovery Flow

Users who forget their password can request a password reset via email.

### 4. Request Forgot Password

**Endpoint:** `POST /api/mobile_memberApi/RequestForgetPassword`

**Content-Type:** `application/json`

**When to Call:** When user clicks "Forgot Password?" on login screen

**Request Body:**
```json
{
  "Email": "ahmed@example.com",
  "CardIdOrPassport": "12345678901234"
}
```

**Field Descriptions:**
- `Email`: User's registered email address
- `CardIdOrPassport`: User's National ID (14 digits) OR Passport Number
  - For Egyptian citizens: National ID (cardId)
  - For foreigners: Passport Number

**Success Response (200 OK):**
```json
{
  "status": 1,
  "message": "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني",
  "data": null
}
```

**Error Response (400 Bad Request):**
```json
{
  "status": 0,
  "message": "البريد الإلكتروني أو الرقم القومي غير صحيح",
  "data": null
}
```

**Common Error Messages:**
- "البريد الإلكتروني أو الرقم القومي غير صحيح" - Email or ID/Passport is incorrect
- "البريد الإلكتروني غير موجود" - Email not found
- "الحساب غير مفعل" - Account is not activated

**Implementation Notes:**
- User will receive an email with password reset instructions
- The actual password reset is done via email link (web-based)
- No need to implement password reset form in the app
- After email is sent, show success message and return to login screen

**UI Flow:**
```
[Login Screen]
  ↓
[User clicks "Forgot Password?"]
  ↓
[Forgot Password Form]
- Email (input)
- National ID or Passport (input)
- Submit button
  ↓
[Submit] → POST /api/mobile_memberApi/RequestForgetPassword
  ↓
IF status == 1:
  Display success message
  "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني"
  [OK button] → Return to Login Screen
ELSE:
  Display error from response.message
  Keep user on forgot password form
```

---

## Complete Post-Registration Journey

### Full User Flow from Registration to Active Account

```
1. USER REGISTERS
   ↓
   POST /api/mobile_memberApi/RegisterCitizen (or RegisterForeigner)
   ↓
   Response: { status: 1, data: { memberId: "67890", ... } }
   ↓
   Store memberId temporarily (for activation)
   ↓

2. SMS ACTIVATION
   ↓
   [Show Activation Code Screen]
   User receives SMS with 4-digit code
   ↓
   User enters code: e.g., "1234"
   ↓
   POST /api/mobile_memberApi/ActivateBySMS
   Body: { memberId: "67890", mobile: "01012345678", code: "1234" }
   ↓
   Response: {
     status: 1,
     data: {
       access_token: "...",
       MemberId: "67890",
       FullName: "أحمد محمد",
       ...
     }
   }
   ↓
   Store access_token, MemberId, FullName in localStorage
   ↓
   User is NOW LOGGED IN AND ACTIVATED
   ↓
   Navigate to Dashboard/Home
   ↓

3. VIEW PROFILE (OPTIONAL)
   ↓
   [User clicks "My Profile"]
   ↓
   GET /api/MoiProfileApi/GetProfile?memberId=67890
   Headers: { Authorization: "Bearer <access_token>" }
   ↓
   Response: { status: 1, data: { fullName: "...", email: "...", ... } }
   ↓
   Display profile information
   ↓

4. USER LOGS OUT AND BACK IN
   ↓
   Clear access_token from localStorage
   ↓
   [Show Login Screen]
   ↓
   POST /token (form-urlencoded)
   Body: userName=..., password=..., grant_type=password
   ↓
   Response: { access_token: "...", MemberId: "...", ... }
   ↓
   Store new access_token
   ↓
   Navigate to Dashboard/Home
```

---

## JavaScript Implementation Examples

### Activate Account by SMS

```javascript
async function activateAccountBySMS(memberId, mobile, code) {
  const payload = {
    memberId: memberId,
    mobile: mobile,
    code: code
  };

  try {
    const response = await fetch(
      'https://webapi.moi.gov.eg/api/mobile_memberApi/ActivateBySMS',
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
        message: result.message || 'Activation failed' 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      message: 'Network error. Please try again.' 
    };
  }
}

// Usage:
const result = await activateAccountBySMS('67890', '01012345678', '1234');
if (result.success) {
  // Navigate to dashboard
  window.location.href = '/dashboard';
} else {
  // Show error message
  alert(result.message);
}
```

### Get User Profile

```javascript
async function getUserProfile(memberId) {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    return { success: false, message: 'Not authenticated' };
  }

  try {
    const response = await fetch(
      `https://webapi.moi.gov.eg/api/MoiProfileApi/GetProfile?memberId=${memberId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = await response.json();
    
    if (result.status === 1) {
      return { 
        success: true, 
        data: result.data
      };
    } else {
      return { 
        success: false, 
        message: result.message || 'Failed to load profile' 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      message: 'Network error. Please try again.' 
    };
  }
}

// Usage:
const memberId = localStorage.getItem('memberId');
const result = await getUserProfile(memberId);
if (result.success) {
  // Display profile data
  console.log('Profile:', result.data);
  displayProfile(result.data);
} else {
  alert(result.message);
}
```

### Request Forgot Password

```javascript
async function requestPasswordReset(email, cardIdOrPassport) {
  const payload = {
    Email: email,
    CardIdOrPassport: cardIdOrPassport
  };

  try {
    const response = await fetch(
      'https://webapi.moi.gov.eg/api/mobile_memberApi/RequestForgetPassword',
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
        message: result.message || 'Password reset email sent'
      };
    } else {
      return { 
        success: false, 
        message: result.message || 'Failed to send reset email' 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      message: 'Network error. Please try again.' 
    };
  }
}

// Usage:
const result = await requestPasswordReset('ahmed@example.com', '12345678901234');
if (result.success) {
  alert(result.message);
  // Return to login screen
  window.location.href = '/login';
} else {
  alert(result.message);
}
```

---

## Activation Code Screen UI Recommendations

### 4-Digit Code Input Pattern

```html
<!-- HTML Structure -->
<div class="activation-code-screen">
  <h2>أدخل رمز التفعيل</h2>
  <p>تم إرسال رمز التفعيل إلى رقم: 01012345678</p>
  
  <div class="code-inputs">
    <input type="text" maxlength="1" id="code1" class="code-box" />
    <input type="text" maxlength="1" id="code2" class="code-box" />
    <input type="text" maxlength="1" id="code3" class="code-box" />
    <input type="text" maxlength="1" id="code4" class="code-box" />
  </div>
  
  <button id="activateBtn">تفعيل الحساب</button>
  
  <div class="resend-code">
    <button id="resendBtn" disabled>
      إعادة إرسال الكود (<span id="countdown">60</span>)
    </button>
  </div>
</div>
```

```javascript
// Auto-focus next input
const codeInputs = document.querySelectorAll('.code-box');
codeInputs.forEach((input, index) => {
  input.addEventListener('input', (e) => {
    if (e.target.value.length === 1 && index < 3) {
      codeInputs[index + 1].focus();
    }
  });
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
      codeInputs[index - 1].focus();
    }
  });
});

// Resend code countdown
let countdown = 60;
const countdownSpan = document.getElementById('countdown');
const resendBtn = document.getElementById('resendBtn');

const timer = setInterval(() => {
  countdown--;
  countdownSpan.textContent = countdown;
  
  if (countdown === 0) {
    clearInterval(timer);
    resendBtn.disabled = false;
    resendBtn.textContent = 'إعادة إرسال الكود';
  }
}, 1000);

// Activate button
document.getElementById('activateBtn').addEventListener('click', async () => {
  const code = Array.from(codeInputs).map(input => input.value).join('');
  
  if (code.length !== 4) {
    alert('يرجى إدخال الرمز كاملاً');
    return;
  }
  
  const memberId = localStorage.getItem('temp_memberId');
  const mobile = localStorage.getItem('temp_mobile');
  
  const result = await activateAccountBySMS(memberId, mobile, code);
  
  if (result.success) {
    // Clear temporary data
    localStorage.removeItem('temp_memberId');
    localStorage.removeItem('temp_mobile');
    
    // Navigate to dashboard
    window.location.href = '/dashboard';
  } else {
    alert(result.message);
    // Clear inputs and focus first
    codeInputs.forEach(input => input.value = '');
    codeInputs[0].focus();
  }
});
```

---

## API Authentication Pattern

All authenticated endpoints require the Bearer token:

```javascript
// Helper function for authenticated requests
async function authenticatedFetch(url, options = {}) {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  // Handle token expiration
  if (response.status === 401) {
    localStorage.clear();
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  
  return response;
}

// Usage:
const response = await authenticatedFetch(
  'https://webapi.moi.gov.eg/api/MoiProfileApi/GetProfile?memberId=67890',
  { method: 'GET' }
);
```

---

## Summary: Required Endpoints for Full Flow

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/token` | POST | Login user | No |
| `/api/mobile_memberApi/RegisterCitizen` | POST | Register Egyptian | No |
| `/api/mobile_memberApi/RegisterForeigner` | POST | Register Foreigner | No |
| `/api/mobile_memberApi/ActivateBySMS` | POST | Activate account with SMS code | No |
| `/api/MoiProfileApi/GetProfile` | GET | Get user profile info | **Yes** |
| `/api/mobile_memberApi/RequestForgetPassword` | POST | Request password reset | No |
| `/api/MoiMasterDataApi/GetNationalities` | GET | Get countries list | No |
| `/api/MoiMasterDataApi/GetGovernorates` | GET | Get governorates list | No |

---

## Implementation Checklist - Post Registration

- [ ] Create SMS activation code screen with 4 input boxes
- [ ] Implement auto-focus between code inputs
- [ ] Add resend code button with 60-second countdown
- [ ] Call ActivateBySMS endpoint with memberId, mobile, code
- [ ] Store token and user data from activation response
- [ ] Automatically log user in after successful activation
- [ ] Navigate to dashboard/home after activation
- [ ] Create "My Profile" screen
- [ ] Implement GetProfile endpoint call with Bearer token
- [ ] Display user profile information (read-only or editable)
- [ ] Create "Forgot Password" form
- [ ] Implement RequestForgetPassword endpoint
- [ ] Show success message for password reset email
- [ ] Handle token expiration (401 errors)
- [ ] Implement logout functionality (clear tokens)
- [ ] Test activation with valid/invalid codes
- [ ] Test profile fetch with valid/expired tokens
- [ ] Test password reset with valid/invalid emails

---

**End of Post-Registration Flows Documentation**

This document covers all post-registration flows including SMS activation, profile retrieval, and password recovery based on analysis of the decompiled  Android APK.
