import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { admin, getApiErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  categoryByValue,
  CATEGORIES,
  STATUS_LABELS,
  STATUS_COLORS,
  PRIORITY_BADGE,
  DEPARTMENT_COLORS,
} from '../utils/constants';

const TABS = ['Overview', 'Issues', 'Users', 'Moderation'];
const OPEN = ['reported', 'acknowledged', 'assigned', 'in_progress'];
const isOverdue = (issue) =>
  issue.slaDeadline && OPEN.includes(issue.status) && new Date(issue.slaDeadline) < new Date();

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState(TABS[0]);
  const [analytics, setAnalytics] = useState(null);
  const [issues, setIssues] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [dept, setDept] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [clearing, setClearing] = useState(null);

  const loadAnalytics = useCallback(async () => {
    try {
      const { data } = await admin.stats();
      setAnalytics(data);
      setError(null);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not load analytics'));
    }
  }, []);

  const loadIssues = useCallback(async () => {
    const params = { search: search || undefined };
    if (dept) params.department = dept;
    if (status) params.status = status;
    if (flaggedOnly) params.flagged = 'true';
    try {
      const { data } = await admin.issues(params);
      setIssues(data.issues);
      setError(null);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not load issues'));
    }
  }, [dept, status, search, flaggedOnly]);

  const loadUsers = useCallback(async () => {
    const params = {};
    if (userSearch) params.search = userSearch;
    if (roleFilter) params.role = roleFilter;
    try {
      const { data } = await admin.users(params);
      setUsers(data.users);
      setError(null);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not load users'));
    }
  }, [userSearch, roleFilter]);

  useEffect(() => {
    const boot = async () => {
      setLoading(true);
      await Promise.all([loadAnalytics(), loadIssues(), loadUsers()]);
      setLoading(false);
    };
    boot();
  }, [loadAnalytics, loadIssues, loadUsers]);

  useEffect(() => {
    if (tab === 'Overview') loadAnalytics();
    if (tab === 'Issues') loadIssues();
    if (tab === 'Users') loadUsers();
  }, [tab, loadAnalytics, loadIssues, loadUsers]);

  const toggleUser = async (target) => {
    try {
      await admin.setUserActive(target.id, !target.isActive);
      setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, isActive: !u.isActive } : u)));
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not update user'));
    }
  };

  const clearSpam = async (id) => {
    setClearing(id);
    try {
      await admin.clearSpam(id);
      setIssues((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not clear spam flag'));
    } finally {
      setClearing(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-28 text-center text-slate-500">
        Loading admin console...
      </div>
    );
  }

  const flaggedIssues = issues.filter((i) => i.flaggedAsSpam);
  const maxTrend = Math.max(1, ...(analytics?.trend || []).map((t) => t.count));
  const maxDept = Math.max(1, ...(analytics?.byDepartment || []).map((d) => d.total));
  const maxCat = Math.max(1, ...(analytics?.byCategory || []).map((c) => c.count));

  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 pt-24">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow mb-3">Control room</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-emerald-950">Admin console</h1>
          <p className="mt-1 text-slate-500">Platform-wide analytics, queue, users and moderation.</p>
        </div>
        <span className="chip bg-gradient-to-br from-emerald-600 to-teal-600 text-white">
          Signed in as {user.name}
        </span>
      </div>

      <div className="glass-strong mb-6 flex flex-wrap gap-1 p-1.5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
              tab === t
                ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-600 hover:bg-white/70'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm font-medium text-rose-600 backdrop-blur">
          {error}
        </div>
      )}

      {tab === 'Overview' && (
        <OverviewPane analytics={analytics} maxTrend={maxTrend} maxDept={maxDept} maxCat={maxCat} />
      )}

      {tab === 'Issues' && (
        <IssuesPane
          issues={issues}
          dept={dept}
          setDept={setDept}
          status={status}
          setStatus={setStatus}
          search={search}
          setSearch={setSearch}
          flaggedOnly={flaggedOnly}
          setFlaggedOnly={setFlaggedOnly}
        />
      )}

      {tab === 'Users' && (
        <UsersPane
          users={users}
          userSearch={userSearch}
          setUserSearch={setUserSearch}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          onToggle={toggleUser}
          selfId={user.id}
        />
      )}

      {tab === 'Moderation' && (
        <ModerationPane issues={flaggedIssues} onClearSpam={clearSpam} clearing={clearing} />
      )}
    </div>
  );
}

function KpiCard({ label, value, accent }) {
  return (
    <div className="glass card-hover p-4">
      <div className={`mb-2 h-1.5 w-8 rounded-full ${accent}`} />
      <p className="text-2xl font-extrabold text-emerald-950">{value}</p>
      <p className="text-xs font-bold text-slate-500">{label}</p>
    </div>
  );
}

function BarList({ label, items, valueKey, max, colorKey }) {
  return (
    <div className="glass p-5">
      <h3 className="mb-4 text-sm font-extrabold text-emerald-950">{label}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">No data yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item[colorKey] ?? 'null'}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-bold text-emerald-900">
                  {item[colorKey] === null ? 'Unassigned' : item[colorKey]}
                </span>
                <span className="font-bold text-slate-500">{item[valueKey]}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/70">
                <div
                  className={`h-full rounded-full ${DEPARTMENT_COLORS[item[colorKey]] || 'bg-emerald-600'}`}
                  style={{ width: `${(item[valueKey] / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OverviewPane({ analytics, maxTrend, maxDept, maxCat }) {
  const a = analytics || {};
  const total = a.totals?.total ?? 0;
  const statusRows = ['reported', 'acknowledged', 'assigned', 'in_progress', 'resolved', 'rejected']
    .map((s) => ({ status: s, count: a.byStatus?.[s] || 0 }))
    .filter((r) => r.count > 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Total reports" value={a.totals?.total ?? '—'} accent="bg-emerald-700" />
        <KpiCard label="Open" value={a.totals?.open ?? '—'} accent="bg-teal-500" />
        <KpiCard label="Overdue" value={a.overdue ?? '—'} accent="bg-rose-500" />
        <KpiCard label="Resolved" value={a.totals?.resolved ?? '—'} accent="bg-green-600" />
        <KpiCard label="Flagged spam" value={a.flagged ?? '—'} accent="bg-orange-500" />
        <KpiCard label="SLA met" value={`${a.sla?.rate ?? 0}%`} accent="bg-lime-500" />
      </div>

      <div className="glass p-5">
        <h3 className="mb-4 text-sm font-extrabold text-emerald-950">Reports — last 14 days</h3>
        {(a.trend || []).length === 0 ? (
          <p className="text-sm text-slate-400">No data yet.</p>
        ) : (
          <div className="flex h-40 items-end gap-1.5">
            {a.trend.map((t) => (
              <div key={t.date} className="group flex flex-1 flex-col items-center justify-end self-stretch">
                <span className="mb-1 text-xs font-bold text-emerald-700 opacity-0 transition-opacity group-hover:opacity-100">
                  {t.count}
                </span>
                <div
                  className="w-full rounded-t bg-gradient-to-t from-emerald-600 to-teal-400 transition-all group-hover:brightness-110"
                  style={{ height: `${(t.count / maxTrend) * 100}%` }}
                />
                <span className="mt-1 text-[10px] font-semibold text-slate-400">{t.date.slice(8)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <BarList
          label="Workload by department"
          items={a.byDepartment || []}
          valueKey="total"
          max={maxDept}
          colorKey="department"
        />
        <div className="glass p-5">
          <h3 className="mb-4 text-sm font-extrabold text-emerald-950">Complaints by category</h3>
          {a.byCategory?.length === 0 ? (
            <p className="text-sm text-slate-400">No data yet.</p>
          ) : (
            <ul className="space-y-3">
              {(a.byCategory || []).map((c) => (
                <li key={c.category}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-bold text-emerald-900">{categoryByValue(c.category).label}</span>
                    <span className="font-bold text-slate-500">{c.count}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/70">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-lime-500"
                      style={{ width: `${(c.count / maxCat) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="glass p-5">
          <h3 className="mb-4 text-sm font-extrabold text-emerald-950">SLA compliance</h3>
          <div className="mb-2 flex items-end justify-between">
            <span className="text-4xl font-extrabold text-emerald-950">{a.sla?.rate ?? 0}%</span>
            <span className="text-sm font-medium text-slate-500">
              {a.sla?.met ?? 0} met · {a.sla?.missed ?? 0} missed
            </span>
          </div>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/70">
            <div className="h-full bg-gradient-to-r from-emerald-600 to-teal-500" style={{ width: `${a.sla?.rate ?? 0}%` }} />
            <div className="h-full bg-gradient-to-r from-rose-500 to-orange-500" style={{ width: `${100 - (a.sla?.rate ?? 0)}%` }} />
          </div>
          <p className="mt-2 text-xs font-medium text-slate-400">Share of resolved issues closed before their SLA deadline.</p>
        </div>

        <div className="glass p-5">
          <h3 className="mb-4 text-sm font-extrabold text-emerald-950">Status split</h3>
          {statusRows.length === 0 ? (
            <p className="text-sm text-slate-400">No data yet.</p>
          ) : (
            <ul className="space-y-2">
              {statusRows.map((r) => (
                <li key={r.status} className="flex items-center gap-3 text-sm">
                  <span className={`h-2.5 w-2.5 rounded-full ${STATUS_COLORS[r.status]}`} />
                  <span className="w-28 font-bold text-emerald-900">{STATUS_LABELS[r.status]}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/70">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(r.count / (total || 1)) * 100}%`, backgroundColor: STATUS_COLORS[r.status] }}
                    />
                  </div>
                  <span className="font-bold text-slate-500">{r.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function IssuesPane({ issues, dept, setDept, status, setStatus, search, setSearch, flaggedOnly, setFlaggedOnly }) {
  return (
    <div>
      <div className="glass mb-4 flex flex-wrap items-center gap-2 p-3">
        <select value={dept} onChange={(e) => setDept(e.target.value)} className="glass-input glass-select !w-auto !py-2 !text-sm">
          <option value="">All departments</option>
          {CATEGORIES.map((c) => (c.department ? <option key={c.department} value={c.department}>{c.department}</option> : null))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="glass-input glass-select !w-auto !py-2 !text-sm">
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, address..." className="glass-input !w-56 !py-2 !text-sm" />
        <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">
          <input type="checkbox" checked={flaggedOnly} onChange={(e) => setFlaggedOnly(e.target.checked)} className="h-4 w-4 rounded border-emerald-300 accent-emerald-600" />
          Flagged
        </label>
      </div>

      {issues.length === 0 ? (
        <div className="glass p-16 text-center text-slate-500">No issues match this view.</div>
      ) : (
        <ul className="space-y-3">
          {issues.map((issue) => {
            const cat = categoryByValue(issue.category);
            const overdue = isOverdue(issue);
            return (
              <li key={issue.id}>
                <Link to={`/issues/${issue.id}`} className="glass card-hover block p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`chip text-white ${DEPARTMENT_COLORS[issue.department]}`}>
                      {issue.department || 'Unassigned'}
                    </span>
                    <span className="chip bg-emerald-100/80 text-emerald-700">{cat.label}</span>
                    <span className={`chip text-white ${STATUS_COLORS[issue.status]}`}>
                      {STATUS_LABELS[issue.status]}
                    </span>
                    <span className={`chip ${PRIORITY_BADGE[issue.priority]}`}>{issue.priority}</span>
                    {issue.flaggedAsSpam && (
                      <span className="chip bg-rose-600 text-white">{issue.flagCount} flags</span>
                    )}
                  </div>
                  <h3 className="mt-2 font-bold text-emerald-950">{issue.title}</h3>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {issue.address || 'No address'} · {issue.upvoteCount} upvotes ·{' '}
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

function UsersPane({ users, userSearch, setUserSearch, roleFilter, setRoleFilter, onToggle, selfId }) {
  const roleBadge = {
    admin: 'bg-emerald-700 text-white',
    staff: 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white',
    citizen: 'bg-white/80 text-slate-600',
  };
  return (
    <div>
      <div className="glass mb-4 flex flex-wrap items-center gap-2 p-3">
        <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search name or email..." className="glass-input !w-64 !py-2 !text-sm" />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="glass-input glass-select !w-auto !py-2 !text-sm">
          <option value="">All roles</option>
          <option value="citizen">Citizen</option>
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {users.length === 0 ? (
        <div className="glass p-16 text-center text-slate-500">No users match this view.</div>
      ) : (
        <ul className="space-y-3">
          {users.map((u) => (
            <li key={u.id} className="glass card-hover flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-emerald-950">{u.name}</span>
                  <span className={`chip ${roleBadge[u.role]}`}>{u.role}</span>
                  {u.department && (
                    <span className={`chip text-white ${DEPARTMENT_COLORS[u.department]}`}>{u.department}</span>
                  )}
                  {!u.isActive && <span className="chip bg-rose-600 text-white">Deactivated</span>}
                </div>
                <p className="mt-0.5 text-sm text-slate-500">
                  {u.email} · {u.createdAt ? `Joined ${new Date(u.createdAt).toLocaleDateString()}` : ''} · {u.reportCount} reports
                </p>
              </div>
              {String(u.id) !== String(selfId) && (
                <button
                  onClick={() => onToggle(u)}
                  className={`btn !px-3 !py-1.5 !text-xs ${
                    u.isActive ? 'btn-danger' : 'btn-success'
                  }`}
                >
                  {u.isActive ? 'Deactivate' : 'Activate'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ModerationPane({ issues, onClearSpam, clearing }) {
  return (
    <div>
      {issues.length === 0 ? (
        <div className="glass p-16 text-center text-slate-500">
          No flagged issues. Community spam flags land here for review.
        </div>
      ) : (
        <ul className="space-y-3">
          {issues.map((issue) => {
            const cat = categoryByValue(issue.category);
            return (
              <li key={issue.id} className="glass card-hover border-rose-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="chip bg-emerald-100/80 text-emerald-700">{cat.label}</span>
                      <span className="chip bg-rose-100 text-rose-700">{issue.flagCount} community flags</span>
                      <span className={`chip text-white ${STATUS_COLORS[issue.status]}`}>
                        {STATUS_LABELS[issue.status]}
                      </span>
                    </div>
                    <h3 className="mt-2 font-bold text-emerald-950">{issue.title}</h3>
                    <p className="mt-0.5 text-sm text-slate-500">{issue.address || 'No address'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/issues/${issue.id}`} className="btn btn-secondary !px-3 !py-1.5 !text-xs">
                      Review
                    </Link>
                    <button
                      onClick={() => onClearSpam(issue.id)}
                      disabled={clearing === issue.id}
                      className="btn btn-success !px-3 !py-1.5 !text-xs"
                    >
                      {clearing === issue.id ? 'Clearing...' : 'Clear flags'}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}