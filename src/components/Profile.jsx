import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCurrentUser, getUserProfile, isLoggedIn, logout } from '../services/api';
import logoImage from '../assets/logo.png';
import '../styles/Dashboard.css';

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }

    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    if (currentUser?.memberId) {
      loadProfile(currentUser.memberId);
    }
  }, [navigate]);

  const loadProfile = async (memberId) => {
    setLoading(true);
    setError('');

    const result = await getUserProfile(memberId);

    if (result.success) {
      setProfile(result.data);
    } else {
      if (result.sessionExpired) {
        navigate('/login');
      } else {
        setError(result.message);
      }
    }

    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <span className="spinner-large"></span>
          <p>جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (error) {
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
          <div className="error-card">
            <svg className="error-icon-large" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p>{error}</p>
            <button onClick={() => loadProfile(user.memberId)} className="btn-primary">
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
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
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-icon">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <h2>الملف الشخصي</h2>
          </div>

          {profile && (
            <div className="profile-details">
              <div className="detail-row">
                <span className="detail-label">الاسم الكامل</span>
                <span className="detail-value">{profile.fullName}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">البريد الإلكتروني</span>
                <span className="detail-value">{profile.email}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">رقم الموبايل</span>
                <span className="detail-value">{profile.mobile}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">رقم العضوية</span>
                <span className="detail-value">{profile.memberId}</span>
              </div>

              {profile.cardId && (
                <>
                  <div className="detail-section-title">بيانات المواطن المصري</div>
                  
                  <div className="detail-row">
                    <span className="detail-label">الرقم القومي</span>
                    <span className="detail-value">{profile.cardId}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">الرقم المسلسل للبطاقة</span>
                    <span className="detail-value">{profile.cardFactoryNumber}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">اسم الأم الأول</span>
                    <span className="detail-value">{profile.motherFirstName}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">المحافظة</span>
                    <span className="detail-value">{profile.governorateName}</span>
                  </div>
                </>
              )}

              {profile.passportNumber && (
                <>
                  <div className="detail-section-title">بيانات المقيم</div>
                  
                  <div className="detail-row">
                    <span className="detail-label">رقم جواز السفر</span>
                    <span className="detail-value">{profile.passportNumber}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">الجنسية</span>
                    <span className="detail-value">{profile.nationalityName}</span>
                  </div>
                </>
              )}

              <div className="detail-row">
                <span className="detail-label">العنوان</span>
                <span className="detail-value">{profile.address}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">المهنة</span>
                <span className="detail-value">{profile.jobTitle}</span>
              </div>
            </div>
          )}

          <div className="profile-actions">
            <Link to="/dashboard" className="btn-secondary">
              العودة إلى الرئيسية
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
