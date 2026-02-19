import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { getCurrentUser, logout, isLoggedIn } from '../services/api';
import { syncWithTrafficService, needsTrafficSync, markTrafficSynced } from '../utils/trafficSync';
import logoImage from '../assets/logo.png';
import '../styles/Dashboard.css';

// Feature flag: set to false to completely disable traffic sync
const ENABLE_TRAFFIC_SYNC = import.meta.env.VITE_ENABLE_TRAFFIC_SYNC !== 'false';

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [trafficSync, setTrafficSync] = useState({
    status: 'idle', // idle, syncing, success, error
    message: ''
  });
  const syncInitiatedRef = useRef(false);

  useEffect(() => {
    const loggedIn = isLoggedIn();
    
    if (!loggedIn) {
      navigate('/login');
      return;
    }
    
    const currentUser = getCurrentUser();
    setUser(currentUser);

    // Store password from navigation state if provided
    if (location.state?.password) {
      localStorage.setItem('user_password', location.state.password);
      navigate(location.pathname, { replace: true, state: {} });
    }

    // Check if traffic sync is enabled and needed (only if not already initiated)
    if (ENABLE_TRAFFIC_SYNC) {
      if (needsTrafficSync() && !syncInitiatedRef.current) {
        syncInitiatedRef.current = true;
        handleTrafficSync(currentUser);
      } else if (!needsTrafficSync()) {
        setTrafficSync({ status: 'success', message: 'اكتملت العملية' });
      }
    } else {
      setTrafficSync({ status: 'idle', message: '' });
    }
  }, [navigate, location]);

  const handleTrafficSync = async (userData) => {
    if (!userData) {
      userData = user;
    }

    setTrafficSync({ status: 'syncing', message: 'جاري معالجة البيانات… لا تغلق الصفحة، قد تستغرق العملية حتى دقيقتين.' });

    try {
      const memberId = userData.memberId;
      const accessToken = localStorage.getItem('access_token');

      if (!memberId) {
        console.error('Member ID not found');
        setTrafficSync({ 
          status: 'error', 
          message: 'معرف العضو غير موجود' 
        });
        return;
      }

      if (!accessToken) {
        console.error('Access token not found');
        setTrafficSync({ 
          status: 'error', 
          message: 'رمز المصادقة غير موجود. يرجى تسجيل الدخول مرة أخرى' 
        });
        return;
      }

      // Call the traffic sync service with authentication
      const result = await syncWithTrafficService(memberId, accessToken);

      if (result.success) {
        markTrafficSynced();
        setTrafficSync({ 
          status: 'success', 
          message: 'اكتملت العملية بنجاح' 
        });
      } else {
        // Check if session expired
        if (result.sessionExpired) {
          logout();
          navigate('/login');
          return;
        }
        
        console.error('Traffic sync failed:', result);
        setTrafficSync({ 
          status: 'error', 
          message: result.message || 'فشلت العملية',
          details: result.details,
          step: result.step
        });
      }
    } catch (error) {
      console.error('Traffic sync exception:', error);
      setTrafficSync({ 
        status: 'error', 
        message: 'حدث خطأ غير متوقع' 
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return <div className="loading-container">جاري التحميل...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <img src={logoImage} alt="Logo" className="logo-image" />
        <div className="header-content">
          <h1></h1>
          <p></p>
        </div>
        <button onClick={handleLogout} className="btn-logout">
          تسجيل الخروج
        </button>
      </div>

      <div className="dashboard-content">
        <div className="welcome-card">
          <div className="welcome-icon">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <h2>مرحباً بك</h2>
          <h3>{user.fullName}</h3>
          
          <div className="user-info">
            <div className="info-item">
              <span className="info-label">رقم العضوية:</span>
              <span className="info-value">{user.memberId}</span>
            </div>
            <div className="info-item">
              <span className="info-label">نوع الحساب:</span>
              <span className="info-value">
                {user.isCitizen ? 'مواطن مصري' : 'مقيم'}
              </span>
            </div>
          </div>

          <div className="success-message">
            <svg className="success-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p>تم تسجيل الدخول بنجاح</p>
          </div>

          {/* Traffic Service Sync Status - Only show if enabled */}
          {ENABLE_TRAFFIC_SYNC && trafficSync.status !== 'idle' && (
            <div className={`sync-status sync-${trafficSync.status}`}>
              <div className="sync-header">
                <h4>حالة العملية</h4>
                {trafficSync.status === 'syncing' && (
                  <span className="spinner"></span>
                )}
                {trafficSync.status === 'success' && (
                  <svg className="status-icon success" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {trafficSync.status === 'error' && (
                  <svg className="status-icon error" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="sync-message">{trafficSync.message}</p>
              {trafficSync.status === 'error' && (
                <>
                  {trafficSync.step && (
                    <p className="sync-details">المرحلة الفاشلة: {trafficSync.step}</p>
                  )}
                  <button 
                    onClick={() => handleTrafficSync()} 
                    className="btn-retry"
                  >
                    إعادة المحاولة
                  </button>
                </>
              )}
            </div>
          )}

          <div className="dashboard-actions">
            <Link to="/profile" className="btn-primary">
              عرض الملف الشخصي
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
