# MOI Mobile API Documentation
## For Web Application Implementation

---

## Table of Contents
1. [Overview](#overview)
2. [Base URL](#base-url)
3. [Common Response Structure](#common-response-structure)
4. [Error Handling](#error-handling)
5. [Authentication & Login](#authentication--login)
6. [User Registration](#user-registration)
7. [Helper Endpoints](#helper-endpoints)
8. [Complete Implementation Flow](#complete-implementation-flow)

---

## Overview

This API provides authentication and registration services for the Egyptian Ministry of Interior (MOI) mobile application. It supports both Egyptian citizens and foreign nationals with different registration flows.

**Key Concepts:**
- **Citizens (Egyptian)**: Use National ID (`cardId`) - `nationalityId = 26`
- **Foreigners (Non-Egyptian)**: Use Passport Number - `nationalityId != 26`

---

## Base URL

```
https://webapi.moi.gov.eg
```

---

## Common Response Structure

All endpoints (except `/token`) return responses in this format:

```json
{
  "status": 1,
  "message": "string or null",
  "data": {} or [] or null
}
```

**Status Codes:**
- `status: 1` = Success
- `status: 0` = Failure/Error
- `status: -1` = No content/Empty result

**Error Handling:**
- When `status != 1`, display the `message` field to the user
- The `message` field contains user-friendly error messages in Arabic
- Always check `status` before processing `data`

---

## Authentication & Login

### 1. Login (Existing User)

**Endpoint:** `POST /token`

**Content-Type:** `application/x-www-form-urlencoded`

**Request Body (Form Data):**
```
userName=<username_or_mobile>
password=<password>
grant_type=password
```

**Success Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1209599,
  "FullName": "أحمد محمد علي",
  "MemberId": "12345",
  "Email": "email@example.com",
  "IsCitizen": "True",
  "Hash": "abc123def456",
  "HashExpiry": "30",
  ".issued": "Thu, 05 Feb 2026 11:04:29 GMT",
  ".expires": "Thu, 19 Feb 2026 11:04:29 GMT"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "invalid_grant",
  "error_description": "The user name or password is incorrect."
}
```

**Implementation Notes:**
- Store `access_token` for authenticated API calls
- Store `MemberId` for user identification
- `IsCitizen` indicates if user is Egyptian ("True") or foreigner ("False")
- Token expires in ~14 days (`expires_in` is in seconds)
- Use `access_token` in `Authorization: Bearer <token>` header for protected endpoints

---

## User Registration

### Registration Flow Decision

1. User enters basic info (name, email, mobile, password)
2. User selects nationality from dropdown
3. **IF `nationalityId == 26` (Egyptian)**: Go to **Citizen Registration**
4. **ELSE**: Go to **Foreigner Registration**

---

### 2. Register Citizen (Egyptian)

**Endpoint:** `POST /api/mobile_memberApi/RegisterCitizen`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "FullName": "أحمد محمد علي السيد",
  "Email": "ahmed@example.com",
  "Mobile": "01012345678",
  "Password": "SecurePass123",
  "ConfirmPassword": "SecurePass123",
  "cardId": "12345678901234",
  "CardFactoryNumber": "123456789",
  "MotherFirstName": "فاطمة",
  "Address": "123 شارع النيل، القاهرة",
  "JobTitle": "مهندس برمجيات",
  "GovernorateId": 1040
}
```

**Field Validations:**
- `FullName`: Required, string
- `Email`: Required, valid email format
- `Mobile`: Required, Egyptian mobile format (11 digits starting with 01)
- `Password`: Required, min 6 characters
- `ConfirmPassword`: Must match `Password`
- `cardId`: Required, exactly 14 digits (National ID)
- `CardFactoryNumber`: Required, exactly 9 digits
- `MotherFirstName`: Required, string
- `Address`: Required, 10-100 characters
- `JobTitle`: Required, 4-100 characters
- `GovernorateId`: Required, integer (see GetGovernorates endpoint)

**Success Response (200 OK):**
```json
{
  "status": 1,
  "message": "تم التسجيل بنجاح، يرجى تفعيل حسابك",
  "data": {
    "memberId": "67890",
    "fullName": "أحمد محمد علي السيد",
    "email": "ahmed@example.com",
    "mobile": "01012345678",
    "cardId": "12345678901234",
    "cardFactoryNumber": "123456789",
    "motherFirstName": "فاطمة",
    "address": "123 شارع النيل، القاهرة",
    "jobTitle": "مهندس برمجيات",
    "governorateId": 1040
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "status": 0,
  "message": "الرقم القومي موجود من قبل",
  "data": null
}
```

**Common Error Messages:**
- "الرقم القومي موجود من قبل" - National ID already exists
- "البريد الإلكتروني مسجل من قبل" - Email already registered
- "رقم الموبايل مسجل من قبل" - Mobile number already registered
- "البيانات المدخلة غير صحيحة" - Invalid data entered

**Next Step After Success:**
- Navigate user to **Activation Code** screen
- User will receive SMS with activation code
- Need to call activation endpoint (see implementation notes)

---

### 3. Register Foreigner (Non-Egyptian)

**Endpoint:** `POST /api/mobile_memberApi/RegisterForeigner`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "FullName": "John Michael Smith",
  "Email": "john@example.com",
  "Mobile": "01012345678",
  "Password": "SecurePass123",
  "ConfirmPassword": "SecurePass123",
  "NationalityId": 3025,
  "PassportNumber": "AB1234567",
  "Address": "456 Nile Street, Cairo",
  "JobTitle": "Software Engineer"
}
```

**Field Validations:**
- `FullName`: Required, string
- `Email`: Required, valid email format
- `Mobile`: Required, Egyptian mobile format (11 digits starting with 01)
- `Password`: Required, min 6 characters
- `ConfirmPassword`: Must match `Password`
- `NationalityId`: Required, integer (see GetNationalities endpoint, must NOT be 26)
- `PassportNumber`: Required, string (passport format varies by country)
- `Address`: Required, 10-100 characters
- `JobTitle`: Required, 4-100 characters

**Success Response (200 OK):**
```json
{
  "status": 1,
  "message": "تم التسجيل بنجاح، يرجى تفعيل حسابك",
  "data": {
    "memberId": "67891",
    "fullName": "John Michael Smith",
    "email": "john@example.com",
    "mobile": "01012345678",
    "nationalityId": 3025,
    "passportNumber": "AB1234567",
    "address": "456 Nile Street, Cairo",
    "jobTitle": "Software Engineer"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "status": 0,
  "message": "رقم الجواز موجود من قبل",
  "data": null
}
```

**Common Error Messages:**
- "رقم الجواز موجود من قبل" - Passport number already exists
- "البريد الإلكتروني مسجل من قبل" - Email already registered
- "رقم الموبايل مسجل من قبل" - Mobile number already registered
- "البيانات المدخلة غير صحيحة" - Invalid data entered

**Next Step After Success:**
- Navigate user to **Activation Code** screen
- User will receive SMS with activation code
- Need to call activation endpoint (see implementation notes)

---

## Helper Endpoints

### 4. Get Nationalities

**Purpose:** Get list of all countries/nationalities for registration dropdown

**Endpoint:** `GET /api/MoiMasterDataApi/GetNationalities`

**Request:** No parameters required

**Response (200 OK):**
```json
{
  "status": 1,
  "message": null,
  "data": [
    {
      "nationalityId": 26,
      "name": "مصرى",
      "nameEn": null,
      "displayOrder": null
    },
    {
      "nationalityId": 3025,
      "name": "الولايات المتحده الامريكيه",
      "nameEn": null,
      "displayOrder": null
    },
    {
      "nationalityId": 3029,
      "name": "بريطانيا",
      "nameEn": null,
      "displayOrder": null
    }
  ]
}
```

**Implementation Notes:**
- Call this endpoint when user opens registration page
- Cache the result for the session
- Display `name` field in dropdown (Arabic names)
- **CRITICAL**: `nationalityId = 26` means Egyptian → use Citizen registration flow
- Any other `nationalityId` → use Foreigner registration flow
- Sort entries alphabetically by `name` for better UX

**Full Nationalities List:** See provided JSON response for complete list of ~80 countries

---

### 5. Get Governorates

**Purpose:** Get list of Egyptian governorates (provinces) for citizen registration

**Endpoint:** `GET /api/MoiMasterDataApi/GetGovernorates`

**Request:** No parameters required

**When to Call:** Only when `nationalityId == 26` (Egyptian citizen registration)

**Response (200 OK):**
```json
{
  "status": 1,
  "message": null,
  "data": [
    {
      "governorateId": 1040,
      "name": "القاهـــرة",
      "nameEn": null,
      "displayOrder": null
    },
    {
      "governorateId": 1140,
      "name": "الأســكندرية",
      "nameEn": null,
      "displayOrder": null
    },
    {
      "governorateId": 1139,
      "name": "الجـــيزة",
      "nameEn": null,
      "displayOrder": null
    }
  ]
}
```

**Implementation Notes:**
- Call this endpoint when Egyptian user proceeds to detailed registration
- Display `name` field in dropdown (Arabic names)
- Cache the result for the session
- **Required field** for Egyptian citizen registration
- Sort entries alphabetically by `name` for better UX

**Full Governorates List:** See provided JSON response for complete list of 27 governorates

---

## Complete Implementation Flow

### User Registration Flow

```
START
  ↓
[Registration Form - Step 1]
- Full Name (input)
- Email (input)
- Mobile (input)
- Password (input)
- Confirm Password (input)
- Nationality (dropdown) ← Call GetNationalities API
  ↓
[User Clicks Next]
  ↓
IF nationalityId == 26:
  ↓
  [Registration Form - Step 2: Egyptian Citizen]
  - Pre-fill: Name, Email, Mobile, Password from Step 1
  - National ID / cardId (14 digits input)
  - Card Factory Number (9 digits input)
  - Mother's First Name (input)
  - Governorate (dropdown) ← Call GetGovernorates API
  - Address (textarea, 10-100 chars)
  - Job Title (input, 4-100 chars)
    ↓
  [Submit] → POST /api/mobile_memberApi/RegisterCitizen
ELSE:
  ↓
  [Registration Form - Step 2: Foreigner]
  - Pre-fill: Name, Email, Mobile, Password, NationalityId from Step 1
  - Passport Number (input)
  - Address (textarea, 10-100 chars)
  - Job Title (input, 4-100 chars)
    ↓
  [Submit] → POST /api/mobile_memberApi/RegisterForeigner
  ↓
[Check Response]
IF status == 1:
  ↓
  Store memberId from response
  Navigate to Activation Code Screen
  Display: "تم التسجيل بنجاح، تم إرسال رمز التفعيل"
ELSE:
  ↓
  Display error message from response.message
  Keep user on registration form
```

### User Login Flow

```
START
  ↓
[Login Form]
- Username/Mobile (input)
- Password (input)
  ↓
[Submit] → POST /token (form-urlencoded)
  ↓
[Check Response]
IF access_token exists:
  ↓
  Store access_token in localStorage/sessionStorage
  Store MemberId
  Store IsCitizen flag
  Navigate to Dashboard/Home
ELSE IF error == "invalid_grant":
  ↓
  Display: "اسم المستخدم أو كلمة المرور غير صحيحة"
  Keep user on login form
ELSE:
  ↓
  Display generic error: "حدث خطأ، يرجى المحاولة مرة أخرى"
```

---

## API Call Examples (JavaScript/Fetch)

### Login Example

```javascript
async function login(username, password) {
  const formData = new URLSearchParams();
  formData.append('userName', username);
  formData.append('password', password);
  formData.append('grant_type', 'password');

  try {
    const response = await fetch('https://webapi.moi.gov.eg/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });

    if (response.ok) {
      const data = await response.json();
      // Store token
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('memberId', data.MemberId);
      localStorage.setItem('fullName', data.FullName);
      return { success: true, data };
    } else {
      const error = await response.json();
      return { 
        success: false, 
        message: error.error_description || 'Login failed' 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      message: 'Network error. Please try again.' 
    };
  }
}
```

### Get Nationalities Example

```javascript
async function getNationalities() {
  try {
    const response = await fetch(
      'https://webapi.moi.gov.eg/api/MoiMasterDataApi/GetNationalities',
      { method: 'GET' }
    );

    if (response.ok) {
      const result = await response.json();
      if (result.status === 1) {
        return { success: true, data: result.data };
      } else {
        return { 
          success: false, 
          message: result.message || 'Failed to load nationalities' 
        };
      }
    }
  } catch (error) {
    return { 
      success: false, 
      message: 'Network error. Please try again.' 
    };
  }
}
```

### Get Governorates Example

```javascript
async function getGovernorates() {
  try {
    const response = await fetch(
      'https://webapi.moi.gov.eg/api/MoiMasterDataApi/GetGovernorates',
      { method: 'GET' }
    );

    if (response.ok) {
      const result = await response.json();
      if (result.status === 1) {
        return { success: true, data: result.data };
      } else {
        return { 
          success: false, 
          message: result.message || 'Failed to load governorates' 
        };
      }
    }
  } catch (error) {
    return { 
      success: false, 
      message: 'Network error. Please try again.' 
    };
  }
}
```

### Register Citizen Example

```javascript
async function registerCitizen(userData) {
  const payload = {
    FullName: userData.fullName,
    Email: userData.email,
    Mobile: userData.mobile,
    Password: userData.password,
    ConfirmPassword: userData.confirmPassword,
    cardId: userData.nationalId,
    CardFactoryNumber: userData.factoryNumber,
    MotherFirstName: userData.motherName,
    Address: userData.address,
    JobTitle: userData.jobTitle,
    GovernorateId: userData.governorateId
  };

  try {
    const response = await fetch(
      'https://webapi.moi.gov.eg/api/mobile_memberApi/RegisterCitizen',
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
        message: result.message || 'Registration failed' 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      message: 'Network error. Please try again.' 
    };
  }
}
```

### Register Foreigner Example

```javascript
async function registerForeigner(userData) {
  const payload = {
    FullName: userData.fullName,
    Email: userData.email,
    Mobile: userData.mobile,
    Password: userData.password,
    ConfirmPassword: userData.confirmPassword,
    NationalityId: userData.nationalityId,
    PassportNumber: userData.passportNumber,
    Address: userData.address,
    JobTitle: userData.jobTitle
  };

  try {
    const response = await fetch(
      'https://webapi.moi.gov.eg/api/mobile_memberApi/RegisterForeigner',
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
        message: result.message || 'Registration failed' 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      message: 'Network error. Please try again.' 
    };
  }
}
```

---

## Error Handling Guide

### For AI Implementation:

1. **Always check response structure first:**
   ```javascript
   if (response.ok) {
     const result = await response.json();
     if (result.status === 1) {
       // Success - process result.data
     } else {
       // API-level error - display result.message
     }
   } else {
     // HTTP error - handle accordingly
   }
   ```

2. **Display errors from API:**
   - The API returns user-friendly messages in Arabic
   - **Always display `result.message`** when `status != 1`
   - Do NOT create custom error messages; use what the API provides

3. **Network errors:**
   - Catch network failures separately
   - Display: "حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى"

4. **Validation errors:**
   - Perform client-side validation BEFORE API call
   - Match the validation rules specified in field descriptions
   - This reduces unnecessary API calls

---

## Field Validation Rules

### Egyptian Mobile Number Format
- Must start with `01`
- Must be exactly 11 digits
- Examples: `01012345678`, `01123456789`
- Regex: `^01[0-9]{9}$`

### National ID (cardId)
- Must be exactly 14 digits
- All numeric characters
- Regex: `^[0-9]{14}$`

### Card Factory Number
- Must be exactly 9 digits
- All numeric characters
- Regex: `^[0-9]{9}$`

### Email
- Standard email validation
- Regex: `^[^\s@]+@[^\s@]+\.[^\s@]+$`

### Password
- Minimum 6 characters
- No specific complexity requirements in the app

### Address
- Minimum 10 characters
- Maximum 100 characters

### Job Title
- Minimum 4 characters
- Maximum 100 characters

---

## Additional Notes

### Activation Flow (Not Fully Documented)
After successful registration, users need to activate their account:
- User receives SMS with activation code
- There is an activation endpoint: `POST /api/mobile_memberApi/ActivateBySMS`
- This was not fully analyzed but the app navigates to `ActivationCodeFragment` after registration

### Authentication Token Usage
- Store the `access_token` from login response
- Use it in `Authorization: Bearer <token>` header for protected endpoints
- Token expires after ~14 days (1,209,599 seconds)

### UI/UX Recommendations
1. Show loading indicators during API calls
2. Display errors in Arabic (from API messages)
3. Disable submit buttons while processing
4. Cache nationality and governorate lists to avoid repeated calls
5. Show password strength indicator
6. Add "Remember Me" option for login
7. Validate Egyptian mobile format on input
8. Auto-format mobile number as user types (01XXXXXXXXX)

---

## Quick Reference: Endpoint Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/token` | POST | Login user |
| `/api/mobile_memberApi/RegisterCitizen` | POST | Register Egyptian citizen |
| `/api/mobile_memberApi/RegisterForeigner` | POST | Register foreigner |
| `/api/MoiMasterDataApi/GetNationalities` | GET | Get list of countries |
| `/api/MoiMasterDataApi/GetGovernorates` | GET | Get list of Egyptian provinces |

---

## Implementation Checklist

- [ ] Create login form with username/password fields
- [ ] Implement login API call with form-urlencoded data
- [ ] Store access token and user info on successful login
- [ ] Create registration form Step 1 (basic info + nationality)
- [ ] Fetch and display nationalities dropdown
- [ ] Implement nationality selection logic (citizen vs foreigner)
- [ ] Create registration form Step 2 for citizens
- [ ] Fetch and display governorates dropdown (citizens only)
- [ ] Create registration form Step 2 for foreigners
- [ ] Implement client-side field validation
- [ ] Call appropriate registration endpoint based on nationality
- [ ] Display API error messages to users
- [ ] Handle network errors gracefully
- [ ] Implement loading states/spinners
- [ ] Create activation code screen (placeholder)
- [ ] Test with various error scenarios
- [ ] Test mobile number format validation
- [ ] Test National ID and Card Factory Number validation
- [ ] Test password mismatch validation

---

**End of Documentation**

This document provides complete information for implementing the MOI registration and login system in a web application. All endpoints, payloads, responses, error handling, and validation rules are documented based on analysis of the decompiled Android APK.
