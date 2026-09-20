import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { issues } from '../services/api';
import IssueMap from '../components/IssueMap';
import { CATEGORIES } from '../utils/constants';

export default function MapView() {
  const [issueList, setIssueList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ category: '', status: '' });

  const loadIssues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;
      const { data } = await issues.list(params);
      setIssueList(data.issues);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not load issues');
    } finally {
      setLoading(false);
    }
  }, [filters.category, filters.status]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  return (
    <div className="px-4 pb-12 pt-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="eyebrow mb-3">Live reports</span>
            <h1 className="text-3xl font-extrabold tracking-tight text-emerald-950">Lahore issue map</h1>
            <p className="mt-1 text-slate-500">Every civic report across the city, in real time.</p>
          </div>
          <Link to="/report" className="btn btn-primary">
            + Report an issue
          </Link>
        </div>

        <div className="glass mb-5 flex flex-wrap items-center gap-3 p-3">
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="glass-input glass-select !w-auto !py-2 !text-sm"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="glass-input glass-select !w-auto !py-2 !text-sm"
          >
            <option value="">All statuses</option>
            {['reported', 'acknowledged', 'assigned', 'in_progress', 'resolved', 'rejected'].map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
          <span className="ml-auto self-center text-sm font-semibold text-slate-500">
            {issueList.length} shown
          </span>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm font-medium text-rose-600 backdrop-blur">
            {error}
          </div>
        )}

        {loading ? (
          <div className="glass p-16 text-center text-slate-500">Loading issues...</div>
        ) : issueList.length === 0 ? (
          <div className="glass p-16 text-center">
            <p className="mb-3 font-semibold text-slate-500">No issues match yet.</p>
            <Link to="/report" className="btn btn-primary !px-5 !py-2.5 !text-sm">
              Report the first one
            </Link>
          </div>
        ) : (
          <div className="map-well">
            <IssueMap issues={issueList} />
          </div>
        )}
      </div>
    </div>
  );
}