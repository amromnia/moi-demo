import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerForeigner } from '../services/api';
import { 
  validatePassportNumber,
  validateAddress,
  validateJobTitle
} from '../utils/validation';
import logoImage from '../assets/logo.png';
import '../styles/Auth.css';

function RegistrationStep2Foreigner() {
  const navigate = useNavigate();
  const [step1Data, setStep1Data] = useState(null);
  const [formData, setFormData] = useState({
    passportNumber: '',
    address: '',
    jobTitle: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    // Load step 1 data
    const savedData = sessionStorage.getItem('registrationStep1');
    if (!savedData) {
      navigate('/register');
      return;
    }
    
    const parsedData = JSON.parse(savedData);
    if (parseInt(parsedData.nationalityId) === 26) {
      navigate('/register/citizen');
      return;
    }
    
    setStep1Data(parsedData);
  }, [navigate]);

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

    const passportValidation = validatePassportNumber(formData.passportNumber);
    if (!passportValidation.valid) errors.passportNumber = passportValidation.message;

    const addressValidation = validateAddress(formData.address);
    if (!addressValidation.valid) errors.address = addressValidation.message;

    const jobValidation = validateJobTitle(formData.jobTitle);
    if (!jobValidation.valid) errors.jobTitle = jobValidation.message;

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      setError('يرجى تصحيح الأخطاء في النموذج');
      return;
    }

    setLoading(true);

    const userData = {
      fullName: step1Data.fullName,
      email: step1Data.email,
      mobile: step1Data.mobile,
      password: step1Data.password,
      confirmPassword: step1Data.confirmPassword,
      nationalityId: step1Data.nationalityId,
      passportNumber: formData.passportNumber,
      address: formData.address,
      jobTitle: formData.jobTitle
    };

    try {
      const result = await registerForeigner(userData);
      
      if (result.success) {
        // Clear session storage
        sessionStorage.removeItem('registrationStep1');
        // Navigate to activation code screen
        navigate('/activation', { 
          state: { 
            memberId: result.data.memberId,
            mobile: userData.mobile,
            password: step1Data.password
          } 
        });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/register');
  };

  if (!step1Data) {
    return <div className="loading-container">جاري التحميل...</div>;
  }

  return (
    <div className="auth-container">
      <div className="auth-card large">
        <div className="auth-header">
          <div className="logo-container">
            <img src={logoImage} alt="Logo" className="logo-image" />
          </div>
          <h1>إنشاء حساب جديد</h1>
          <p className="auth-subtitle">مقيم</p>
          <div className="steps-indicator">
            <div className="step completed">✓</div>
            <div className="step-line active"></div>
            <div className="step active">2</div>
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
            <label htmlFor="passportNumber">رقم جواز السفر *</label>
            <input
              type="text"
              id="passportNumber"
              name="passportNumber"
              value={formData.passportNumber}
              onChange={handleChange}
              placeholder="أدخل رقم جواز السفر"
              className={fieldErrors.passportNumber ? 'error' : ''}
              required
            />
            {fieldErrors.passportNumber && (
              <span className="field-error">{fieldErrors.passportNumber}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="address">العنوان *</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="أدخل العنوان الكامل (10-100 حرف)"
              rows="3"
              minLength="10"
              maxLength="100"
              className={fieldErrors.address ? 'error' : ''}
              required
            />
            <div className="char-counter">
              {formData.address.length} / 100
            </div>
            {fieldErrors.address && (
              <span className="field-error">{fieldErrors.address}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="jobTitle">المهنة *</label>
            <input
              type="text"
              id="jobTitle"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              placeholder="أدخل المهنة (4-100 حرف)"
              minLength="4"
              maxLength="100"
              className={fieldErrors.jobTitle ? 'error' : ''}
              required
            />
            {fieldErrors.jobTitle && (
              <span className="field-error">{fieldErrors.jobTitle}</span>
            )}
          </div>

          <div className="button-group">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={handleBack}
              disabled={loading}
            >
              السابق
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  جاري التسجيل...
                </>
              ) : (
                'إنشاء الحساب'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegistrationStep2Foreigner;
