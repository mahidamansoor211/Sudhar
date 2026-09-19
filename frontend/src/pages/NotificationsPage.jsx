import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { notifications } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { STATUS_LABELS } from '../utils/constants';

const TYPE_ICONS = {
  upvote: '▲',
  status_change: '🔄',
  comment: '💬',
  flag: '🚩',
  resolution_confirmed: '✅',
  system: '🔔',
  default: '🔔',
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
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
        <button
          onClick={handleMarkAllRead}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
        >
          Mark all read
        </button>
      </div>

      {loading && <p className="text-center text-gray-500">Loading…</p>}
      {error && <p className="text-center text-red-600">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">
          No notifications yet — you will be notified when your reports get updates.
        </div>
      )}

      <ul className="space-y-3">
        {items.map((n) => (
          <li key={n.id}>
            <Link
              to={n.issueId ? `/issues/${n.issueId}` : '#'}
              onClick={() => handleMarkRead(n)}
              className={`block rounded-xl border bg-white p-4 shadow-sm transition-colors hover:border-green-300 ${
                n.read ? 'border-gray-200' : 'border-green-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{TYPE_ICONS[n.type] || TYPE_ICONS.default}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-800">{n.title}</p>
                  {notifText(n) !== n.title && (
                    <p className="mt-0.5 text-sm text-gray-500">{notifText(n)}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                    <time title={new Date(n.createdAt).toLocaleString()}>
                      {new Date(n.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </time>
                    {n.issueStatus && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 font-semibold text-gray-600">
                        {STATUS_LABELS[n.issueStatus] || n.issueStatus}
                      </span>
                    )}
                  </div>
                </div>
                {!n.read && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-green-500" />}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}