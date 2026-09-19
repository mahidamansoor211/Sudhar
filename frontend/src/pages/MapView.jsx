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
    <div className="px-4 pb-10 pt-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Lahore issue map</h1>
            <p className="text-gray-500">Live civic reports across the city.</p>
          </div>
          <Link
            to="/report"
            className="rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            + Report an issue
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-2">
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-600 focus:outline-none"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-600 focus:outline-none"
          >
            <option value="">All statuses</option>
            {['reported', 'acknowledged', 'assigned', 'in_progress', 'resolved', 'rejected'].map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
          <span className="self-center text-sm text-gray-500">{issueList.length} shown</span>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-600 bg-red-100 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-16 text-center text-gray-500 shadow-sm">
            Loading issues…
          </div>
        ) : issueList.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-16 text-center text-gray-500 shadow-sm">
            <p className="mb-3">No issues match yet.</p>
            <Link to="/report" className="font-semibold text-blue-600 hover:underline">
              Report the first one
            </Link>
          </div>
        ) : (
          <IssueMap issues={issueList} />
        )}
      </div>
    </div>
  );
}