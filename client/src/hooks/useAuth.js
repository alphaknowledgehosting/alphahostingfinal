import { useAuth as useAuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const auth = useAuthContext();
  
  if (!auth) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return auth;
};
