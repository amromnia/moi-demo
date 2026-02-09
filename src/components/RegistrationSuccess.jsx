import { useLocation, Link } from 'react-router-dom';
import logoImage from '../assets/logo.png';
import '../styles/Auth.css';

function RegistrationSuccess() {
  const location = useLocation();
  const message = location.state?.message || 'تم التسجيل بنجاح';

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-container">
            <img src={logoImage} alt="Logo" className="logo-image" />
          </div>
          <h1>تم التسجيل بنجاح</h1>
          <p className="auth-subtitle"> - </p>
        </div>

        <div className="success-container">
          <div className="success-icon-large">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>

          <div className="success-message">
            <p>{message}</p>
            <p className="success-note">
              تم إرسال رمز التفعيل إلى رقم الموبايل المسجل
            </p>
          </div>

          <div className="info-box">
            <svg className="info-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p>يرجى تفعيل حسابك باستخدام رمز التفعيل المرسل</p>
          </div>

          <Link to="/login" className="btn-primary">
            الذهاب إلى صفحة تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RegistrationSuccess;
