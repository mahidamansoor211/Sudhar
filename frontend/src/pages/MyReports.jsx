import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { issues, getImageUrl } from '../services/api';
import { categoryByValue, STATUS_LABELS } from '../utils/constants';
import { useAuth } from '../context/AuthContext';

function ReportCard({ report }) {
  const cat = categoryByValue(report.category);
  return (
    <Link
      to={`/issues/${report.id}`}
      className="block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {report.images.length > 0 && (
        <img src={getImageUrl(report.images[0])} alt="" className="h-40 w-full object-cover" />
      )}
      <div className="p-4">
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
            {cat.label}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${
              report.status === 'rejected'
                ? 'bg-red-600'
                : report.status === 'resolved'
                  ? 'bg-green-600'
                  : 'bg-amber-500'
            }`}
          >
            {STATUS_LABELS[report.status] || report.status}
          </span>
        </div>
        <h3 className="font-semibold text-gray-800">{report.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-gray-500">
          {report.address || 'No address provided'}
        </p>
        <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
          <span>
            {new Date(report.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </span>
          <span>▲ {report.upvoteCount}</span>
        </div>
      </div>
    </Link>
  );
}

function ReportGrid({ title, list }) {
  if (list.length === 0) return null;
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-bold text-gray-800">{title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {list.map((r) => (
          <ReportCard key={r.id} report={r} />
        ))}
      </div>
    </section>
  );
}

export default function MyReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    issues
      .myReports({ includeUpvoted: true })
      .then(({ data }) => setReports(data.reports))
      .catch((e) => setError(e.response?.data?.message || 'Could not load your reports'))
      .finally(() => setLoading(false));
  }, []);

  const submitted = reports.filter((r) => r.submittedByMe);
  const upvoted = reports.filter((r) => !r.submittedByMe);

  if (loading) {
    return <div className="mx-auto max-w-4xl px-5 pt-24 text-center text-gray-500">Loading…</div>;
  }

  if (error) {
    return <div className="mx-auto max-w-4xl px-5 pt-24 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-5 pb-16 pt-24">
      <h1 className="mb-1 text-2xl font-bold text-gray-800">My reports</h1>
      <p className="mb-6 text-gray-500">
        Welcome, {user.name}. Track everything you submitted and upvoted in one place.
      </p>

      {reports.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">
          You have not reported or upvoted any issues yet.{' '}
          <Link to="/report" className="font-semibold text-blue-600 hover:underline">
            Report an issue
          </Link>
        </div>
      )}

      <ReportGrid title={`My submissions (${submitted.length})`} list={submitted} />
      <ReportGrid title={`Issues I upvoted (${upvoted.length})`} list={upvoted} />
    </div>
  );
}