import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNationalities } from '../services/api';
import { 
  validateFullName, 
  validateEmail, 
  validateMobile, 
  validatePassword,
  validateConfirmPassword 
} from '../utils/validation';
import '../styles/Auth.css';

function RegistrationStep1() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    nationalityId: ''
  });
  const [nationalities, setNationalities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingNationalities, setLoadingNationalities] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    loadNationalities();
  }, []);

  const loadNationalities = async () => {
    setLoadingNationalities(true);
    const result = await getNationalities();
    
    if (result.success) {
      // Sort alphabetically by name
      const sorted = result.data.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
      setNationalities(sorted);
    } else {
      setError(result.message);
    }
    
    setLoadingNationalities(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear errors when user starts typing
    if (error) setError('');
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: '' });
    }
  };

  const validateForm = () => {
    const errors = {};

    const nameValidation = validateFullName(formData.fullName);
    if (!nameValidation.valid) errors.fullName = nameValidation.message;

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.valid) errors.email = emailValidation.message;

    const mobileValidation = validateMobile(formData.mobile);
    if (!mobileValidation.valid) errors.mobile = mobileValidation.message;

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) errors.password = passwordValidation.message;

    const confirmPasswordValidation = validateConfirmPassword(
      formData.password, 
      formData.confirmPassword
    );
    if (!confirmPasswordValidation.valid) {
      errors.confirmPassword = confirmPasswordValidation.message;
    }

    if (!formData.nationalityId) {
      errors.nationalityId = 'الجنسية مطلوبة';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      setError('يرجى تصحيح الأخطاء في النموذج');
      return;
    }

    // Store data in sessionStorage for next step
    sessionStorage.setItem('registrationStep1', JSON.stringify(formData));

    // Navigate to appropriate step 2 based on nationality
    const nationalityId = parseInt(formData.nationalityId);
    if (nationalityId === 26) {
      // Egyptian citizen
      navigate('/register/citizen');
    } else {
      // Foreigner
      navigate('/register/foreigner');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card large">
        <div className="auth-header">
          <div className="logo-container">
            
          </div>
          <h1>إنشاء حساب جديد</h1>
          <p className="auth-subtitle"> - </p>
          <div className="steps-indicator">
            <div className="step active">1</div>
            <div className="step-line"></div>
            <div className="step">2</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="fullName">الاسم الكامل *</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="أدخل الاسم الرباعي"
              className={fieldErrors.fullName ? 'error' : ''}
              required
            />
            {fieldErrors.fullName && (
              <span className="field-error">{fieldErrors.fullName}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">البريد الإلكتروني *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@email.com"
              className={fieldErrors.email ? 'error' : ''}
              required
            />
            {fieldErrors.email && (
              <span className="field-error">{fieldErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="mobile">رقم الموبايل *</label>
            <input
              type="tel"
              id="mobile"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="01xxxxxxxxx"
              maxLength="11"
              className={fieldErrors.mobile ? 'error' : ''}
              required
            />
            {fieldErrors.mobile && (
              <span className="field-error">{fieldErrors.mobile}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="nationalityId">الجنسية *</label>
            {loadingNationalities ? (
              <div className="loading-select">جاري تحميل قائمة الجنسيات...</div>
            ) : (
              <select
                id="nationalityId"
                name="nationalityId"
                value={formData.nationalityId}
                onChange={handleChange}
                className={fieldErrors.nationalityId ? 'error' : ''}
                required
              >
                <option value="">اختر الجنسية</option>
                {nationalities.map((nationality) => (
                  <option key={nationality.nationalityId} value={nationality.nationalityId}>
                    {nationality.name}
                  </option>
                ))}
              </select>
            )}
            {fieldErrors.nationalityId && (
              <span className="field-error">{fieldErrors.nationalityId}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">كلمة المرور *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="6 أحرف على الأقل"
              className={fieldErrors.password ? 'error' : ''}
              required
            />
            {fieldErrors.password && (
              <span className="field-error">{fieldErrors.password}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">تأكيد كلمة المرور *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="أعد إدخال كلمة المرور"
              className={fieldErrors.confirmPassword ? 'error' : ''}
              required
            />
            {fieldErrors.confirmPassword && (
              <span className="field-error">{fieldErrors.confirmPassword}</span>
            )}
          </div>

          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading || loadingNationalities}
          >
            التالي
          </button>

          <div className="auth-footer">
            <p>لديك حساب بالفعل؟ <a href="/login">تسجيل الدخول</a></p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegistrationStep1;
