import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { requestPasswordReset } from '../services/api';
import { validateEmail } from '../utils/validation';
import '../styles/Auth.css';

function ForgotPassword() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    cardIdOrPassport: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear errors when user starts typing
    if (error) setError('');
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    const errors = {};

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.valid) errors.email = emailValidation.message;

    if (!formData.cardIdOrPassport || formData.cardIdOrPassport.trim() === '') {
      errors.cardIdOrPassport = 'الرقم القومي أو رقم الجواز مطلوب';
    }

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

    try {
      const result = await requestPasswordReset(
        formData.email,
        formData.cardIdOrPassport
      );

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="logo-container">
              
            </div>
            <h1>تم إرسال الرابط</h1>
            <p className="auth-subtitle"> - </p>
          </div>

          <div className="success-container">
            <div className="success-icon-large">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>

            <div className="success-message">
              <p>تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني</p>
              <p className="success-note">
                يرجى التحقق من بريدك الإلكتروني واتباع التعليمات
              </p>
            </div>

            <div className="info-box">
              <svg className="info-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p>إذا لم تستلم البريد، تحقق من مجلد الرسائل غير المرغوب فيها</p>
            </div>

            <Link to="/login" className="btn-primary">
              العودة إلى تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-container">
            
          </div>
          <h1>نسيت كلمة المرور</h1>
          <p className="auth-subtitle"> - </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <p className="form-description">
            أدخل بريدك الإلكتروني ورقمك القومي أو رقم جواز السفر لاستعادة كلمة المرور
          </p>

          {error && (
            <div className="error-message">
              <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

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
              disabled={loading}
              required
            />
            {fieldErrors.email && (
              <span className="field-error">{fieldErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="cardIdOrPassport">الرقم القومي أو رقم الجواز *</label>
            <input
              type="text"
              id="cardIdOrPassport"
              name="cardIdOrPassport"
              value={formData.cardIdOrPassport}
              onChange={handleChange}
              placeholder="أدخل الرقم القومي أو رقم جواز السفر"
              className={fieldErrors.cardIdOrPassport ? 'error' : ''}
              disabled={loading}
              required
            />
            {fieldErrors.cardIdOrPassport && (
              <span className="field-error">{fieldErrors.cardIdOrPassport}</span>
            )}
          </div>

          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                جاري الإرسال...
              </>
            ) : (
              'إرسال رابط إعادة التعيين'
            )}
          </button>

          <div className="auth-footer">
            <p>تذكرت كلمة المرور؟ <Link to="/login">تسجيل الدخول</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;
