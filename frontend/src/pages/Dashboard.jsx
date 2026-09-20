import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { staff, getApiErrorMessage } from '../services/api';
import {
  categoryByValue,
  STATUS_LABELS,
  STATUS_COLORS,
  PRIORITY_BADGE,
} from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from './AdminDashboard';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'reported', label: 'Reported' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function Dashboard() {
  const { user } = useAuth();

  if (user.role === 'admin') {
    return <AdminDashboard />;
  }

  return <StaffDashboard user={user} />;
}

function StaffDashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loadingIssueList, setLoadingIssueList] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  const title = `${user.department} staff queue`;

  const loadStats = useCallback(async () => {
    try {
      const { data } = await staff.stats();
      setStats(data);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not load stats'));
    }
  }, []);

  const loadIssues = useCallback(async () => {
    setLoadingIssueList(true);
    try {
      const params = { search: search || undefined };
      if (filter) params.status = filter;
      if (flaggedOnly) params.flagged = 'true';
      const { data } = await staff.queue(params);
      setIssues(data.issues);
      setError(null);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not load issues'));
    } finally {
      setLoadingIssueList(false);
    }
  }, [filter, search, flaggedOnly]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  const statusCount = (s) => stats?.byStatus?.[s] || 0;

  return (
    <div className="mx-auto max-w-5xl px-5 pb-16 pt-24">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <p className="text-gray-500">
            Work the queue for {user.department}.
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
          {user.role === 'staff' ? `Department: ${user.department}` : 'Admin'}
        </span>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Open" value={stats?.openCount ?? '—'} accent="bg-blue-500" />
        <StatCard label="In progress" value={statusCount('in_progress') || '—'} accent="bg-amber-500" />
        <StatCard label="Overdue" value={stats?.overdueCount ?? '—'} accent="bg-red-500" />
        <StatCard label="Resolved" value={stats?.resolvedCount ?? '—'} accent="bg-green-600" />
        <StatCard label="Verified" value={stats?.confirmedCount ?? '—'} accent="bg-emerald-400" />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-600 bg-red-100 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Queue controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
              filter === f.value
                ? 'bg-blue-600 text-white'
                : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {f.label}
            {stats?.byStatus?.[f.value] ? ` (${stats.byStatus[f.value]})` : ''}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, address…"
          className="ml-auto rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-blue-600 focus:outline-none"
        />
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={flaggedOnly}
            onChange={(e) => setFlaggedOnly(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          Flagged
        </label>
      </div>

      {/* Queue */}
      {loadingIssueList ? (
        <div className="rounded-xl border border-gray-200 bg-white p-16 text-center text-gray-500 shadow-sm">
          Loading queue…
        </div>
      ) : issues.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-16 text-center text-gray-500 shadow-sm">
          No issues match this view.
        </div>
      ) : (
        <ul className="space-y-3">
          {issues.map((issue) => {
            const cat = categoryByValue(issue.category);
            const overdue =
              issue.slaDeadline &&
              ['reported', 'acknowledged', 'assigned', 'in_progress'].includes(issue.status) &&
              new Date(issue.slaDeadline) < new Date();
            return (
              <li key={issue.id}>
                <Link
                  to={`/issues/${issue.id}`}
                  className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:border-blue-300 hover:shadow-md"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
                      {cat.label}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${STATUS_COLORS[issue.status]}`}
                    >
                      {STATUS_LABELS[issue.status]}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PRIORITY_BADGE[issue.priority]}`}
                    >
                      {issue.priority} priority
                    </span>
                    {issue.flaggedAsSpam && (
                      <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                        🚩 Spam
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 font-semibold text-gray-800">{issue.title}</h3>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {issue.address || 'No address'}
                    {' · '}▲ {issue.upvoteCount}
                    {' · '}
                    {overdue ? (
                      <span className="font-semibold text-red-600">
                        overdue since{' '}
                        {new Date(issue.slaDeadline).toLocaleDateString()}
                      </span>
                    ) : issue.slaDeadline ? (
                      <>SLA {new Date(issue.slaDeadline).toLocaleDateString()}</>
                    ) : null}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className={`mb-2 h-1.5 w-8 rounded-full ${accent}`} />
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs font-medium text-gray-500">{label}</p>
    </div>
  );
}