import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/api';
import '../styles/Auth.css';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    
    if (!formData.username || !formData.password) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Attempting login...');
      const result = await login(formData.username, formData.password);
      console.log('Login result:', result);
      
      if (result.success) {
        // Double-check token was saved
        const token = localStorage.getItem('access_token');
        console.log('Token after login:', !!token);
        
        if (!token) {
          console.error('Token not found in localStorage after successful login');
          setError('فشل حفظ بيانات الجلسة، يرجى المحاولة مرة أخرى');
          setLoading(false);
          return;
        }
        
        console.log('Navigating to dashboard...');
        // Use replace to avoid back button issues and window.location as fallback
        try {
          navigate('/dashboard', { replace: true });
        } catch (navError) {
          console.error('Navigate failed, using fallback:', navError);
          window.location.href = '/dashboard';
        }
      } else {
        setError(result.message);
        setLoading(false);
      }
    } catch (err) {
      console.error('Login exception:', err);
      setError('حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-container">
            <div className="logo-badge">MOI</div>
          </div>
          <h1>تسجيل الدخول</h1>
          <p className="auth-subtitle">وزارة الداخلية - جمهورية مصر العربية</p>
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
            <label htmlFor="username">اسم المستخدم أو رقم الموبايل</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="أدخل اسم المستخدم أو رقم الموبايل"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">كلمة المرور</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="أدخل كلمة المرور"
              disabled={loading}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                جاري تسجيل الدخول...
              </>
            ) : (
              'تسجيل الدخول'
            )}
          </button>

          <div className="auth-footer">
            <p><Link to="/forgot-password" className="forgot-link">نسيت كلمة المرور؟</Link></p>
            <p>ليس لديك حساب؟ <Link to="/register">إنشاء حساب جديد</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
