import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import RegistrationStep1 from './components/RegistrationStep1';
import RegistrationStep2Citizen from './components/RegistrationStep2Citizen';
import RegistrationStep2Foreigner from './components/RegistrationStep2Foreigner';
import ActivationCode from './components/ActivationCode';
import RegistrationSuccess from './components/RegistrationSuccess';
import ForgotPassword from './components/ForgotPassword';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import { isLoggedIn } from './services/api';

// Protected route wrapper that checks auth on each render
function ProtectedRoute({ children }) {
  const loggedIn = isLoggedIn();
  
  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register" element={<RegistrationStep1 />} />
        <Route path="/register/citizen" element={<RegistrationStep2Citizen />} />
        <Route path="/register/foreigner" element={<RegistrationStep2Foreigner />} />
        <Route path="/activation" element={<ActivationCode />} />
        <Route path="/registration-success" element={<RegistrationSuccess />} />
        <Route 
          path="/dashboard" 
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
        />
        <Route 
          path="/profile" 
          element={<ProtectedRoute><Profile /></ProtectedRoute>} 
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
