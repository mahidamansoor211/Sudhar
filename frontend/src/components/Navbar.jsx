import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { notifications } from "../services/api";

function Pill({ to, children, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `rounded-full px-4 py-2 text-sm font-bold transition-colors ${
          isActive
            ? "bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30"
            : "text-slate-600 hover:bg-white hover:text-emerald-800"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadCount, markAsRead } = useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  const isStaff = user && user.role !== "citizen";

  const links = !user ? [] : isStaff
    ? [{ to: "/dashboard", label: "Dashboard", end: true }]
    : [
        { to: "/map", label: "Map" },
        { to: "/report", label: "Report" },
        { to: "/my-reports", label: "My Reports" },
      ];

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate("/");
  };

  const handleNotifClick = async (id) => {
    try {
      if (id) await markAsRead(id);
    } catch {
      // ignore
    }
    setShowNotifs(false);
  };

  return (
    <header className="fixed inset-x-0 top-3 z-50 px-4">
      <div className="glass-strong mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-2xl px-4 py-2.5">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/images/logo-nav.png" alt="Sudhar logo" className="h-9 w-auto" />
          <span className="text-xl font-black tracking-tight text-emerald-950">
            Sudhar
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Pill key={l.to} to={l.to} end={l.end}>
              {l.label}
            </Pill>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <button
                onClick={() => setShowNotifs((s) => !s)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/60 text-emerald-800 transition-colors hover:bg-white/90"
                aria-label="Notifications"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-orange-500 px-1 text-[11px] font-bold text-white shadow-md">
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 py-1.5 pl-1.5 pr-3.5 text-white shadow-lg shadow-emerald-600/30 transition-transform hover:scale-[1.03]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/25 text-sm font-extrabold uppercase">
                  {(user.name || user.email || "?").slice(0, 2)}
                </span>
                <span className="text-sm font-bold">{user.name || user.email}</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden rounded-full px-4 py-2 text-sm font-bold text-emerald-900 hover:bg-white/40 sm:block">
                Sign in
              </Link>
              <Link to="/register" className="rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition-transform hover:scale-[1.03]">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>

      {user && open && (
        <div className="mx-auto mt-2 max-w-6xl">
          <div className="glass-strong ml-auto w-56 rounded-2xl p-2">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              {user.role?.toUpperCase()}
            </p>
            <Pill to={isStaff ? "/dashboard" : "/my-reports"} end>
              {isStaff ? "Dashboard" : "My Reports"}
            </Pill>
            <Pill to="/">Home</Pill>
            <button onClick={handleLogout} className="mt-1 w-full rounded-xl bg-rose-500/10 px-4 py-2 text-left text-sm font-bold text-rose-600 transition-colors hover:bg-rose-500/20">
              Sign out
            </button>
          </div>
        </div>
      )}

      {user && showNotifs && (
        <div className="mx-auto mt-2 max-w-6xl">
          <div className="glass-strong ml-auto w-80 rounded-2xl p-3">
            <div className="mb-2 flex items-center justify-between px-2">
              <span className="text-sm font-extrabold text-emerald-950">Notifications</span>
              <Link to="/notifications" onClick={() => setShowNotifs(false)} className="text-xs font-bold text-emerald-600 hover:underline">
                See all
              </Link>
            </div>
            <LiveNotifList onPick={handleNotifClick} />
          </div>
        </div>
      )}

      {user && (
        <nav className="mt-2 flex gap-1 overflow-x-auto md:hidden">
          <div className="glass-strong flex gap-1 overflow-x-auto rounded-2xl p-1">
            {links.map((l) => (
              <Pill key={l.to} to={l.to} end={l.end}>
                {l.label}
              </Pill>
            ))}
            <Link to="/notifications" className="rounded-full px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-white hover:text-emerald-800">
              Notifications
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

function LiveNotifList({ onPick }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    notifications
      .list({ limit: 5 })
      .then(({ data }) => {
        if (active) setItems(data.notifications);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!loaded) {
    return <p className="px-2 py-3 text-sm text-emerald-700/70">Loading…</p>;
  }

  if (items.length === 0) {
    return <p className="px-2 py-3 text-sm text-emerald-700/70">No notifications yet.</p>;
  }

  return (
    <div className="max-h-72 space-y-1 overflow-y-auto glass-scroll">
      {items.map((n) => (
        <Link
          key={n.id}
          to={n.issueId ? `/issues/${n.issueId}` : "/notifications"}
          onClick={() => onPick(n.id)}
          className="flex items-start gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-emerald-50/80"
        >
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-emerald-950">{n.title}</span>
            <span className="block truncate text-xs text-emerald-700/70">{n.message}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}