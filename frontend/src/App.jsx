import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import InstallPWA from './components/InstallPWA';
import { Toaster } from 'react-hot-toast';

const App = () => {
  const location = useLocation();
  const hideNavbar = location.pathname === '/login' || location.pathname === '/register' || location.pathname.startsWith('/track');

  return (
    <div className="min-h-screen text-slate-100">
      {!hideNavbar && <Navbar />}
      <Outlet />
      <InstallPWA />
      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
};

export default App;
