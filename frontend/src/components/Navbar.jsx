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

function MenuItem({ to, children, icon, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
          isActive
            ? "bg-emerald-600/10 text-emerald-800"
            : "text-slate-600 hover:bg-white/80 hover:text-emerald-800"
        }`
      }
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center">{icon}</span>
      {children}
    </NavLink>
  );
}

const iconProps = {
  xmlns: "http://www.w3.org/2000/svg",
  className: "h-4 w-4",
  fill: "none",
  viewBox: "0 0 24 24",
  stroke: "currentColor",
  strokeWidth: 2,
};
const Icons = {
  home: (
    <svg {...iconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4h2v4a1 1 0 001 1m-4 0h4" />
    </svg>
  ),
  grid: (
    <svg {...iconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  clipboard: (
    <svg {...iconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  bell: (
    <svg {...iconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  logout: (
    <svg {...iconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
};

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
          <div
            className="glass-strong ml-auto w-64 overflow-hidden rounded-2xl p-2 shadow-xl shadow-emerald-950/10"
            onMouseLeave={() => setOpen(false)}
          >
            <div className="mb-1 flex items-center gap-3 rounded-xl bg-white/50 px-3 py-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 text-sm font-extrabold uppercase text-white shadow-md shadow-emerald-600/30">
                {(user.name || user.email || "?").slice(0, 2)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-emerald-950">
                  {user.name || user.email}
                </p>
                <p className="truncate text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                  {user.role}
                  {user.department ? ` · ${user.department}` : ""}
                </p>
              </div>
            </div>

            <div className="space-y-0.5">
              {isStaff ? (
                <MenuItem to="/dashboard" end icon={Icons.grid} onClick={() => setOpen(false)}>
                  Dashboard
                </MenuItem>
              ) : (
                <>
                  <MenuItem to="/my-reports" icon={Icons.clipboard} onClick={() => setOpen(false)}>
                    My Reports
                  </MenuItem>
                  <MenuItem to="/report" icon={Icons.clipboard} onClick={() => setOpen(false)}>
                    Report an issue
                  </MenuItem>
                </>
              )}
              <MenuItem to="/notifications" icon={Icons.bell} onClick={() => setOpen(false)}>
                Notifications
              </MenuItem>
              <MenuItem to="/" end icon={Icons.home} onClick={() => setOpen(false)}>
                Home
              </MenuItem>
            </div>

            <div className="my-2 h-px bg-emerald-950/10" />

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-rose-600 transition-colors hover:bg-rose-500/10"
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center">{Icons.logout}</span>
              Sign out
            </button>
          </div>
        </div>
      )}

      {user && showNotifs && (
        <div className="mx-auto mt-2 max-w-6xl">
          <div
            className="glass-strong ml-auto w-80 rounded-2xl p-3 shadow-xl shadow-emerald-950/10"
            onMouseLeave={() => setShowNotifs(false)}
          >
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