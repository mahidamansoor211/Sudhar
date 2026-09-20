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
          <span className="eyebrow mb-3">Staff console</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-emerald-950">{title}</h1>
          <p className="mt-1 text-slate-500">Work the queue for {user.department}.</p>
        </div>
        <span className="chip bg-gradient-to-br from-emerald-600 to-teal-600 text-white">
          {user.role === 'staff' ? `Department: ${user.department}` : 'Admin'}
        </span>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Open" value={stats?.openCount ?? '—'} accent="bg-emerald-600" />
        <StatCard label="In progress" value={statusCount('in_progress') || '—'} accent="bg-teal-500" />
        <StatCard label="Overdue" value={stats?.overdueCount ?? '—'} accent="bg-rose-500" />
        <StatCard label="Resolved" value={stats?.resolvedCount ?? '—'} accent="bg-green-600" />
        <StatCard label="Verified" value={stats?.confirmedCount ?? '—'} accent="bg-lime-500" />
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm font-medium text-rose-600 backdrop-blur">
          {error}
        </div>
      )}

      <div className="glass mb-4 flex flex-wrap items-center gap-2 p-3">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`chip cursor-pointer transition-colors ${
              filter === f.value
                ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-white/70 text-slate-600 hover:bg-white'
            } !py-1.5`}
          >
            {f.label}
            {stats?.byStatus?.[f.value] ? ` (${stats.byStatus[f.value]})` : ''}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, address..." 
          className="glass-input glass-select !ml-auto !w-56 !py-2 !text-sm"
        />
        <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">
          <input
            type="checkbox"
            checked={flaggedOnly}
            onChange={(e) => setFlaggedOnly(e.target.checked)}
            className="h-4 w-4 rounded border-emerald-300 accent-emerald-600"
          />
          Flagged
        </label>
      </div>

      {loadingIssueList ? (
        <div className="glass p-16 text-center text-slate-500">Loading queue...</div>
      ) : issues.length === 0 ? (
        <div className="glass p-16 text-center text-slate-500">No issues match this view.</div>
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
                <Link to={`/issues/${issue.id}`} className="glass card-hover block p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="chip bg-emerald-100/80 text-emerald-700">{cat.label}</span>
                    <span className={`chip text-white ${STATUS_COLORS[issue.status]}`}>
                      {STATUS_LABELS[issue.status]}
                    </span>
                    <span className={`chip ${PRIORITY_BADGE[issue.priority]}`}>
                      {issue.priority} priority
                    </span>
                    {issue.flaggedAsSpam && (
                      <span className="chip bg-rose-600 text-white">Spam</span>
                    )}
                  </div>
                  <h3 className="mt-2 font-bold text-emerald-950">{issue.title}</h3>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {issue.address || 'No address'}
                    {' · '}{issue.upvoteCount} upvotes
                    {' · '}
                    {overdue ? (
                      <span className="font-bold text-rose-600">
                        overdue since {new Date(issue.slaDeadline).toLocaleDateString()}
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
    <div className="glass card-hover p-4">
      <div className={`mb-2 h-1.5 w-8 rounded-full ${accent}`} />
      <p className="text-2xl font-extrabold text-emerald-950">{value}</p>
      <p className="text-xs font-bold text-slate-500">{label}</p>
    </div>
  );
}