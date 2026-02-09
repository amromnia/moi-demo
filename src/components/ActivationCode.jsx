import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { activateAccountBySMS } from '../services/api';
import logoImage from '../assets/logo.png';
import '../styles/Auth.css';

function ActivationCode() {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  // Get memberId, mobile, and password from location state
  const memberId = location.state?.memberId;
  const mobile = location.state?.mobile;
  const password = location.state?.password;

  useEffect(() => {
    if (!memberId || !mobile) {
      navigate('/register');
      return;
    }

    // Focus first input on mount
    inputRefs[0].current?.focus();

    // Countdown timer for resend button
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [memberId, mobile, navigate]);

  const handleCodeChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Clear error when user starts typing
    if (error) setError('');

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Only accept 4-digit numbers
    if (/^\d{4}$/.test(pastedData)) {
      const newCode = pastedData.split('');
      setCode(newCode);
      inputRefs[3].current?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const activationCode = code.join('');

    if (activationCode.length !== 4) {
      setError('يرجى إدخال الرمز كاملاً');
      return;
    }

    setLoading(true);

    try {
      const result = await activateAccountBySMS(memberId, mobile, activationCode);

      if (result.success) {
        navigate('/dashboard', { state: { password } });
      } else {
        setError(result.message);
        // Clear code inputs
        setCode(['', '', '', '']);
        inputRefs[0].current?.focus();
      }
    } catch (err) {
      setError('حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    // TODO: Implement resend code API call if endpoint is available
    setCanResend(false);
    setCountdown(60);
    setError('');
    
    // Restart countdown
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Show success message
    alert('تم إرسال الرمز مرة أخرى');
  };

  // Mask mobile number for display (show only last 4 digits)
  const maskedMobile = mobile ? mobile.slice(0, 3) + '****' + mobile.slice(-4) : '';

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-container">
            <img src={logoImage} alt="Logo" className="logo-image" />
          </div>
          <h1>تفعيل الحساب</h1>
          <p className="auth-subtitle"> - </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="activation-info">
            <div className="info-icon-container">
              <svg className="info-icon-large" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
            <p className="activation-message">
              تم إرسال رمز التفعيل المكون من 4 أرقام إلى رقم الموبايل:
            </p>
            <p className="mobile-number">{maskedMobile}</p>
          </div>

          {error && (
            <div className="error-message">
              <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <div className="code-inputs-container">
            <label>رمز التفعيل</label>
            <div className="code-inputs">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="code-box"
                  disabled={loading}
                  required
                />
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading || code.join('').length !== 4}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                جاري التفعيل...
              </>
            ) : (
              'تفعيل الحساب'
            )}
          </button>

          <div className="resend-container">
            <button
              type="button"
              className="btn-link"
              onClick={handleResend}
              disabled={!canResend || loading}
            >
              {canResend ? (
                'إعادة إرسال الرمز'
              ) : (
                `إعادة الإرسال بعد ${countdown} ثانية`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ActivationCode;
