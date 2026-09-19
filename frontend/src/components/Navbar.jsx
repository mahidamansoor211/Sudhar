import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { notifications } from '../services/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadCount, markAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const onHome = location.pathname === '/';
  const [notifOpen, setNotifOpen] = useState(false);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setNotifOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function onClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const toggleNotifs = async () => {
    const next = !notifOpen;
    setNotifOpen(next);
    if (next && user) {
      try {
        const { data } = await notifications.list({ limit: 6 });
        setRecentNotifs(data.notifications);
      } catch {
        setRecentNotifs([]);
      }
    }
  };

  const handleNotifClick = (n) => {
    if (!n.read) markAsRead(n.id).catch(() => {});
    setNotifOpen(false);
    if (n.issueId) navigate(`/issues/${n.issueId}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinkClass = ({ isActive }) =>
    `px-3 py-2 font-medium transition-colors ${
      isActive
        ? 'text-green-400 underline decoration-green-400 underline-offset-8'
        : onHome
          ? 'text-white hover:underline hover:decoration-green-400 hover:text-white hover:underline-offset-8'
          : 'text-gray-800 hover:underline hover:decoration-green-600 hover:text-green-600 hover:underline-offset-8'
    }`;

  const ghostBtnClass = onHome
    ? 'rounded-lg border border-white/70 px-4 py-2 font-semibold text-white transition-colors hover:bg-white/10'
    : 'rounded-lg border border-gray-200 px-4 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-50';

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 flex flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-6 ${
        onHome ? 'bg-transparent' : 'bg-white shadow-sm'
      }`}
    >
      <Link
        to="/"
        className={`flex items-center gap-2 text-[1.35rem] font-bold ${onHome ? 'text-white' : 'text-gray-800'}`}
      >
        <img src="/images/logo-nav.png" alt="Sudhar logo" className="block h-10 w-auto" />
        Sudhar
        <span className={`font-medium ${onHome ? 'text-white/75' : 'text-gray-500'}`}>— Lahore</span>
      </Link>

      <div className="flex items-center gap-1 sm:gap-2">
        {user && user.role === 'citizen' && (
          <>
            <NavLink to="/map" className={navLinkClass}>
              Map
            </NavLink>
            <NavLink to="/report" className={navLinkClass}>
              Report
            </NavLink>
            <NavLink to="/my-reports" className={navLinkClass}>
              My reports
            </NavLink>
          </>
        )}
        {user && user.role !== 'citizen' && (
          <NavLink to="/dashboard" className={navLinkClass}>
            Dashboard
          </NavLink>
        )}
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleNotifs}
                aria-label="Notifications"
                className={`relative rounded-full p-2 transition-colors ${
                  onHome ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[0.65rem] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div
                  className={`absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border bg-white shadow-lg ${
                    onHome ? 'border-gray-200 text-gray-800' : ''
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
                    <span className="text-sm font-semibold text-gray-700">Notifications</span>
                    <Link
                      to="/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      View all
                    </Link>
                  </div>
                  {recentNotifs.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-gray-500">
                      No notifications yet
                    </p>
                  ) : (
                    <ul className="max-h-72 overflow-y-auto">
                      {recentNotifs.map((n) => (
                        <li key={n.id} className="border-b border-gray-50 last:border-0">
                          <button
                            onClick={() => handleNotifClick(n)}
                            className={`flex w-full items-start gap-2 px-4 py-2.5 text-left transition-colors hover:bg-gray-50 ${
                              n.read ? 'opacity-60' : ''
                            }`}
                          >
                            <span
                              className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                                n.read ? 'bg-gray-300' : 'bg-green-500'
                              }`}
                            />
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium text-gray-800">
                                {n.title}
                              </span>
                              <span className="block text-xs text-gray-500">
                                {new Date(n.createdAt).toLocaleString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <span
              className={`hidden items-center gap-2 font-medium sm:flex ${onHome ? 'text-white' : 'text-gray-800'}`}
            >
              {user.name}
              {user.role !== 'citizen' && (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    onHome ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                  }`}
                >
                  {user.role === 'staff' ? user.department : 'Admin'}
                </span>
              )}
            </span>
            <button className={ghostBtnClass} onClick={handleLogout}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className={ghostBtnClass}>
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}