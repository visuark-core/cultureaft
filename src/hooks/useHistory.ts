import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const useHistory = () => {
  const location = useLocation();

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('navigationHistory') || '[]');
    history.push(location.pathname);
    localStorage.setItem('navigationHistory', JSON.stringify(history));
  }, [location]);
};

export default useHistory;