import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const useNavigation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const goTo = (path: string) => {
    navigate(path);
  };

  const goBack = () => {
    navigate(-1);
  };

  const goToHome = () => {
    navigate('/');
  };

  const goToLogin = () => {
    navigate('/login');
  };

  const goToDashboard = () => {
    if (user?.role === 'admin') {
      navigate('/admin/products');
    } else if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const goToAdminDashboard = () => {
    if (user?.role === 'admin') {
      navigate('/admin/products');
    } else {
      navigate('/'); // Or some other appropriate redirect
    }
  };

  return { goTo, goBack, goToHome, goToLogin, goToDashboard, goToAdminDashboard };
};