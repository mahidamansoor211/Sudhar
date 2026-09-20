import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { issues, getImageUrl } from '../services/api';
import { categoryByValue, STATUS_LABELS, STATUS_COLORS } from '../utils/constants';
import { useAuth } from '../context/AuthContext';

function ReportCard({ report }) {
  const cat = categoryByValue(report.category);
  return (
    <Link to={`/issues/${report.id}`} className="glass card-hover block overflow-hidden">
      {report.images.length > 0 && (
        <img src={getImageUrl(report.images[0])} alt="" className="h-44 w-full object-cover" />
      )}
      <div className="p-5">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="chip bg-emerald-100/80 text-emerald-700">{cat.label}</span>
          <span className={`chip text-white ${STATUS_COLORS[report.status] || 'bg-amber-500'}`}>
            {STATUS_LABELS[report.status] || report.status}
          </span>
        </div>
        <h3 className="font-bold text-emerald-950">{report.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{report.address || 'No address provided'}</p>
        <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-400">
          <span>
            {new Date(report.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
          <span className="chip bg-gradient-to-br from-emerald-600 to-teal-600 text-white">{report.upvoteCount} upvotes</span>
        </div>
      </div>
    </Link>
  );
}

function ReportGrid({ title, list }) {
  if (list.length === 0) return null;
  return (
    <section className="mb-9">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-lg font-extrabold text-emerald-950">{title}</h2>
        <span className="h-px flex-1 bg-gradient-to-r from-emerald-300 to-transparent" />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
    return <div className="mx-auto max-w-4xl px-5 pt-28 text-center text-slate-500">Loading...</div>;
  }

  if (error) {
    return <div className="mx-auto max-w-4xl px-5 pt-28 text-center text-rose-600">{error}</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-5 pb-16 pt-24">
      <div className="mb-8">
        <span className="eyebrow mb-3">Your corner</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-emerald-950">My reports</h1>
        <p className="mt-1 text-slate-500">
          Welcome, <span className="font-bold text-gradient">{user.name}</span>. Track everything you submitted and upvoted.
        </p>
      </div>

      {reports.length === 0 && (
        <div className="glass p-12 text-center">
          <p className="mb-4 font-semibold text-slate-500">You have not reported or upvoted any issues yet.</p>
          <Link to="/report" className="btn btn-primary !px-6 !py-2.5 !text-sm">
            Report an issue
          </Link>
        </div>
      )}

      <ReportGrid title={`My submissions (${submitted.length})`} list={submitted} />
      <ReportGrid title={`Issues I upvoted (${upvoted.length})`} list={upvoted} />
    </div>
  );
}