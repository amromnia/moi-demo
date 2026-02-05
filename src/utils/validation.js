/**
 * Validation utilities for MOI application forms
 */

/**
 * Validate Egyptian mobile number format
 * Must start with 01 and be exactly 11 digits
 * @param {string} mobile 
 * @returns {{valid: boolean, message?: string}}
 */
export function validateMobile(mobile) {
  if (!mobile || mobile.trim() === '') {
    return { valid: false, message: 'رقم الموبايل مطلوب' };
  }
  
  const mobileRegex = /^01[0-9]{9}$/;
  if (!mobileRegex.test(mobile)) {
    return { 
      valid: false, 
      message: 'رقم الموبايل يجب أن يبدأ بـ 01 ويتكون من 11 رقم' 
    };
  }
  
  return { valid: true };
}

/**
 * Validate email format
 * @param {string} email 
 * @returns {{valid: boolean, message?: string}}
 */
export function validateEmail(email) {
  if (!email || email.trim() === '') {
    return { valid: false, message: 'البريد الإلكتروني مطلوب' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { 
      valid: false, 
      message: 'البريد الإلكتروني غير صحيح' 
    };
  }
  
  return { valid: true };
}

/**
 * Validate password
 * Minimum 6 characters
 * @param {string} password 
 * @returns {{valid: boolean, message?: string}}
 */
export function validatePassword(password) {
  if (!password || password.trim() === '') {
    return { valid: false, message: 'كلمة المرور مطلوبة' };
  }
  
  if (password.length < 6) {
    return { 
      valid: false, 
      message: 'كلمة المرور يجب أن تتكون من 6 أحرف على الأقل' 
    };
  }
  
  return { valid: true };
}

/**
 * Validate password confirmation
 * @param {string} password 
 * @param {string} confirmPassword 
 * @returns {{valid: boolean, message?: string}}
 */
export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword || confirmPassword.trim() === '') {
    return { valid: false, message: 'تأكيد كلمة المرور مطلوب' };
  }
  
  if (password !== confirmPassword) {
    return { 
      valid: false, 
      message: 'كلمة المرور وتأكيد كلمة المرور غير متطابقين' 
    };
  }
  
  return { valid: true };
}

/**
 * Validate National ID (Egyptian)
 * Must be exactly 14 digits
 * @param {string} cardId 
 * @returns {{valid: boolean, message?: string}}
 */
export function validateNationalId(cardId) {
  if (!cardId || cardId.trim() === '') {
    return { valid: false, message: 'الرقم القومي مطلوب' };
  }
  
  const idRegex = /^[0-9]{14}$/;
  if (!idRegex.test(cardId)) {
    return { 
      valid: false, 
      message: 'الرقم القومي يجب أن يتكون من 14 رقم' 
    };
  }
  
  return { valid: true };
}

/**
 * Validate Card Factory Number
 * Must be exactly 9 digits
 * @param {string} factoryNumber 
 * @returns {{valid: boolean, message?: string}}
 */
export function validateFactoryNumber(factoryNumber) {
  if (!factoryNumber || factoryNumber.trim() === '') {
    return { valid: false, message: 'الرقم المسلسل للبطاقة مطلوب' };
  }
  
  if (factoryNumber.length !== 9) {
    return { 
      valid: false, 
      message: 'الرقم المسلسل للبطاقة يجب أن يتكون من 9 أرقام' 
    };
  }
  
  return { valid: true };
}

/**
 * Validate address
 * 10-100 characters
 * @param {string} address 
 * @returns {{valid: boolean, message?: string}}
 */
export function validateAddress(address) {
  if (!address || address.trim() === '') {
    return { valid: false, message: 'العنوان مطلوب' };
  }
  
  if (address.length < 10) {
    return { 
      valid: false, 
      message: 'العنوان يجب أن يتكون من 10 أحرف على الأقل' 
    };
  }
  
  if (address.length > 100) {
    return { 
      valid: false, 
      message: 'العنوان يجب ألا يزيد عن 100 حرف' 
    };
  }
  
  return { valid: true };
}

/**
 * Validate job title
 * 4-100 characters
 * @param {string} jobTitle 
 * @returns {{valid: boolean, message?: string}}
 */
export function validateJobTitle(jobTitle) {
  if (!jobTitle || jobTitle.trim() === '') {
    return { valid: false, message: 'المهنة مطلوبة' };
  }
  
  if (jobTitle.length < 4) {
    return { 
      valid: false, 
      message: 'المهنة يجب أن تتكون من 4 أحرف على الأقل' 
    };
  }
  
  if (jobTitle.length > 100) {
    return { 
      valid: false, 
      message: 'المهنة يجب ألا تزيد عن 100 حرف' 
    };
  }
  
  return { valid: true };
}

/**
 * Validate passport number
 * @param {string} passportNumber 
 * @returns {{valid: boolean, message?: string}}
 */
export function validatePassportNumber(passportNumber) {
  if (!passportNumber || passportNumber.trim() === '') {
    return { valid: false, message: 'رقم الجواز مطلوب' };
  }
  
  if (passportNumber.length < 5) {
    return { 
      valid: false, 
      message: 'رقم الجواز غير صحيح' 
    };
  }
  
  return { valid: true };
}

/**
 * Validate full name
 * @param {string} fullName 
 * @returns {{valid: boolean, message?: string}}
 */
export function validateFullName(fullName) {
  if (!fullName || fullName.trim() === '') {
    return { valid: false, message: 'الاسم الكامل مطلوب' };
  }
  
  if (fullName.trim().length < 3) {
    return { 
      valid: false, 
      message: 'الاسم الكامل يجب أن يتكون من 3 أحرف على الأقل' 
    };
  }
  
  return { valid: true };
}

/**
 * Validate mother's first name
 * @param {string} motherName 
 * @returns {{valid: boolean, message?: string}}
 */
export function validateMotherName(motherName) {
  if (!motherName || motherName.trim() === '') {
    return { valid: false, message: 'اسم الأم مطلوب' };
  }
  
  if (motherName.trim().length < 2) {
    return { 
      valid: false, 
      message: 'اسم الأم يجب أن يتكون من حرفين على الأقل' 
    };
  }
  
  return { valid: true };
}

/**
 * Validate required field
 * @param {any} value 
 * @param {string} fieldName 
 * @returns {{valid: boolean, message?: string}}
 */
export function validateRequired(value, fieldName) {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return { valid: false, message: `${fieldName} مطلوب` };
  }
  
  return { valid: true };
}
