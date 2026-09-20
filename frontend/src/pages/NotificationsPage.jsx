import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { notifications } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { STATUS_LABELS } from '../utils/constants';

const TYPE_ICON = (n) => {
  switch (n.type) {
    case 'upvote':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
      );
    case 'status_change':
    case 'resolution_confirmed':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    case 'flag':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      );
  }
};

function notifText(n) {
  return n.message || n.title;
}

export default function NotificationsPage() {
  const { markAllAsRead } = useNotifications();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () =>
    notifications
      .list({ limit: 100 })
      .then(({ data }) => setItems(data.notifications))
      .catch((e) => setError(e.response?.data?.message || 'Could not load notifications'))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // ignored
    }
  };

  const handleMarkRead = async (n) => {
    if (n.read) return;
    try {
      await notifications.markAsRead(n.id);
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    } catch {
      // ignored
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-5 pb-16 pt-24">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <span className="eyebrow mb-3">Activity</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-emerald-950">Notifications</h1>
        </div>
        <button onClick={handleMarkAllRead} className="btn btn-secondary !px-4 !py-2 !text-sm">
          Mark all read
        </button>
      </div>

      {loading && <p className="text-center text-slate-500">Loading...</p>}
      {error && <p className="text-center text-rose-600">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <div className="glass p-12 text-center font-semibold text-slate-500">
          No notifications yet — you will be notified when your reports get updates.
        </div>
      )}

      <ul className="space-y-3.5">
        {items.map((n) => (
          <li key={n.id}>
            <Link
              to={n.issueId ? `/issues/${n.issueId}` : '#'}
              onClick={() => handleMarkRead(n)}
              className={`glass card-hover block p-4 transition-opacity ${n.read ? 'opacity-70' : ''}`}
            >
              <div className="flex items-start gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700">
                  {TYPE_ICON(n)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-emerald-950">{n.title}</p>
                  {notifText(n) !== n.title && <p className="mt-0.5 text-sm text-slate-500">{notifText(n)}</p>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400">
                    <time title={new Date(n.createdAt).toLocaleString()}>
                      {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </time>
                    {n.issueStatus && (
                      <span className="chip bg-slate-100/90 text-slate-600">
                        {STATUS_LABELS[n.issueStatus] || n.issueStatus}
                      </span>
                    )}
                  </div>
                </div>
                {!n.read && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md" />}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}