import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCurrentUser, logout, isLoggedIn } from '../services/api';
import '../styles/Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    console.log('Dashboard mounted, checking login status...');
    const loggedIn = isLoggedIn();
    console.log('Is logged in:', loggedIn);
    
    if (!loggedIn) {
      console.log('Not logged in, redirecting to login...');
      navigate('/login');
      return;
    }
    
    const currentUser = getCurrentUser();
    console.log('Current user:', currentUser);
    setUser(currentUser);
  }, [navigate]);

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
