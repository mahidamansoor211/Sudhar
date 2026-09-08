import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <img src="/images/logo-nav.png" alt="Sudhar logo" className="navbar-logo" />
        Sudhar<span className="brand-sub"> — Lahore</span>
      </Link>

      <div className="navbar-links">
        {user && user.role === 'citizen' && (
          <>
            <NavLink to="/map" className="nav-link">
              Map
            </NavLink>
            <NavLink to="/report" className="nav-link">
              Report
            </NavLink>
            <NavLink to="/my-reports" className="nav-link">
              My reports
            </NavLink>
          </>
        )}
        {user && user.role !== 'citizen' && (
          <NavLink to="/dashboard" className="nav-link">
            Dashboard
          </NavLink>
        )}
      </div>

      <div className="navbar-auth">
        {user ? (
          <>
            <span className="navbar-user">
              {user.name}
              {user.role !== 'citizen' && (
                <span className="role-badge">{user.role === 'staff' ? user.department : 'Admin'}</span>
              )}
            </span>
            <button className="btn btn-ghost" onClick={handleLogout}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost">
              Sign in
            </Link>
            <Link to="/register" className="btn btn-primary">
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}