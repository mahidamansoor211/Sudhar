import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { issues, staff, getImageUrl, getApiErrorMessage } from '../services/api';
import {
  categoryByValue,
  STATUS_LABELS,
  STATUS_TRANSITIONS,
  PRIORITIES,
  PRIORITY_LABELS,
} from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function IssueDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { refreshUnread } = useNotifications();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upvoteLoading, setUpvoteLoading] = useState(false);
  const [flagLoading, setFlagLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(false);
  const [confirmImages, setConfirmImages] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [staffActionLoading, setStaffActionLoading] = useState(false);

  const fetchIssue = () =>
    issues.get(id).then(({ data }) => setIssue(data.issue));

  useEffect(() => {
    let active = true;
    issues
      .get(id)
      .then(({ data }) => {
        if (active) setIssue(data.issue);
      })
      .catch((e) => {
        if (active) setError(e.response?.data?.message || 'Issue not found');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  // Staff/admin: load assignable staff for this department once.
  useEffect(() => {
    if (user && (user.role === 'staff' || user.role === 'admin')) {
      staff
        .members()
        .then(({ data }) => setStaffMembers(data.staff))
        .catch(() => {});
    }
  }, [user]);

  const canManage = () =>
    issue &&
    user &&
    (user.role === 'admin' ||
      (user.role === 'staff' && issue.department === user.department));

  const nextStatuses = issue ? STATUS_TRANSITIONS[issue.status] || [] : [];

  const runStaffAction = async (fn) => {
    setStaffActionLoading(true);
    setError(null);
    try {
      await fn();
      await fetchIssue();
      refreshUnread().catch(() => {});
    } catch (e) {
      setError(getApiErrorMessage(e, 'Action failed'));
    } finally {
      setStaffActionLoading(false);
    }
  };

  const handleStatusChange = (status) =>
    runStaffAction(() => staff.changeStatus(id, { status }));

  const handleAssign = () => {
    if (!selectedAssignee) return;
    runStaffAction(() => staff.assign(id, { assignedTo: selectedAssignee }));
  };

  const handlePriority = (priority) =>
    runStaffAction(() => staff.setPriority(id, priority));

  const handleUpvote = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setUpvoteLoading(true);
    try {
      await issues.upvote(id);
      setIssue((prev) => ({ ...prev, upvoteCount: prev.upvoteCount + 1, upvotedByMe: true }));
    } catch (e) {
      if (e.response?.status === 401) navigate('/login');
      else
        setError(
          e.response?.data?.message || 'Could not upvote — you may have already upvoted this'
        );
    } finally {
      setUpvoteLoading(false);
    }
  };

  const handleFlag = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!window.confirm('Flag this report as irrelevant or spam?')) return;
    setFlagLoading(true);
    try {
      const { data } = await issues.flag(id);
      setIssue((prev) => ({
        ...prev,
        flaggedByMe: true,
        flagCount: data.flagCount,
        flaggedAsSpam: data.flaggedAsSpam,
      }));
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not flag this issue'));
    } finally {
      setFlagLoading(false);
    }
  };

  const handleConfirmResolution = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setConfirmLoading(true);
    try {
      const formData = new FormData();
      confirmImages.forEach(([file]) => formData.append('images', file));
      const { data } = await issues.confirmResolution(id, formData);
      setIssue((prev) => ({ ...prev, ...data }));
      setConfirmSuccess(true);
      refreshUnread().catch(() => {});
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not confirm resolution'));
    } finally {
      setConfirmLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-24 text-center text-gray-500">
        Loading…
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-24 text-center">
        <p className="mb-4 text-red-600">{error || 'Issue not found.'}</p>
        <Link to="/map" className="font-semibold text-blue-600 hover:underline">
          Back to map
        </Link>
      </div>
    );
  }

  const category = categoryByValue(issue.category);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-24">
      <Link to="/map" className="mb-4 inline-block font-semibold text-blue-600 hover:underline">
        ← Back to map
      </Link>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
          {category.label}
        </span>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
          {issue.department || 'Admin triage'}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${
            issue.status === 'rejected'
              ? 'bg-red-600'
              : issue.status === 'resolved'
                ? 'bg-green-600'
                : 'bg-amber-500'
          }`}
        >
          {STATUS_LABELS[issue.status] || issue.status}
        </span>
      </div>

      <h1 className="mb-2 text-2xl font-bold text-gray-800">{issue.title}</h1>
      {issue.description && <p className="mb-4 text-gray-600">{issue.description}</p>}

      <div className="mb-4 flex flex-wrap gap-4 text-sm text-gray-500">
        <span>📍 {issue.address || `${issue.location.coordinates[1].toFixed(5)}, ${issue.location.coordinates[0].toFixed(5)}`}</span>
        <span>▲ {issue.upvoteCount} upvote{issue.upvoteCount === 1 ? '' : 's'}</span>
        {issue.slaDeadline && (
          <span>
            ⏱ Surge target:{' '}
            {new Date(issue.slaDeadline).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        )}
      </div>

      {issue.images.length > 0 && (
        <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {issue.images.map((img) => (
            <img
              key={img}
              src={getImageUrl(img)}
              alt="issue evidence"
              className="w-full rounded-xl border border-gray-200 object-cover"
            />
          ))}
        </div>
      )}

      {user && user.role === 'citizen' && !issue.upvotedByMe && (
        <button
          onClick={handleUpvote}
          disabled={upvoteLoading}
          className="mb-5 rounded-lg border border-blue-600 bg-white px-4 py-2.5 font-semibold text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-60"
        >
          ▲ Upvote
        </button>
      )}
      {user && user.role === 'citizen' && issue.upvotedByMe && (
        <span className="mb-5 inline-block rounded-lg bg-green-50 px-4 py-2.5 font-semibold text-green-700">
          ✓ Upvoted
        </span>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        {user && user.role === 'citizen' && !issue.flaggedByMe && (
          <button
            onClick={handleFlag}
            disabled={flagLoading}
            className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
          >
            🚩 Flag as irrelevant
          </button>
        )}
        {user && user.role === 'citizen' && issue.flaggedByMe && (
          <span className="inline-block rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600">
            🚩 Flagged by you
          </span>
        )}
        {issue.flaggedAsSpam && (
          <span className="inline-block rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white">
            This report has been marked as spam by the community
          </span>
        )}
      </div>

      {user &&
        user.role === 'citizen' &&
        issue.submittedByMe &&
        issue.status === 'resolved' &&
        !issue.resolutionConfirmedByReporter &&
        !confirmSuccess && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4">
            <h2 className="mb-1 font-semibold text-green-800">
              Confirm resolution — was this complaint actually fixed?
            </h2>
            <p className="mb-3 text-sm text-green-700">
              Let enable us know it is resolved at this location. Optionally attach a photo as
              proof.
            </p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setConfirmImages(Array.from(e.target.files).map((f) => [f]))}
              className="mb-3 block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-green-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
            <button
              onClick={handleConfirmResolution}
              disabled={confirmLoading}
              className="rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60"
            >
              {confirmLoading ? 'Confirming…' : '✓ Confirm resolved at this location'}
            </button>
          </div>
        )}
      {user &&
        user.role === 'citizen' &&
        issue.submittedByMe &&
        issue.status === 'resolved' &&
        (issue.resolutionConfirmedByReporter || confirmSuccess) && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 font-semibold text-green-700">
            ✅ You confirmed this issue is resolved.
          </div>
        )}

      {canManage() && (
        <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50/50 p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-gray-800">
              {user.role === 'admin' ? 'Admin actions' : `${issue.department} staff actions`}
            </h2>
            <span className="text-xs text-gray-500">
              Assignee:{' '}
              {issue.assignedTo ? issue.assignedTo.name : 'Not assigned yet'}
            </span>
          </div>

          {/* Status transitions */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Move to:</span>
            {nextStatuses.length === 0 ? (
              <span className="text-sm text-gray-400">No further transitions allowed.</span>
            ) : (
              nextStatuses.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={staffActionLoading}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 ${
                    s === 'rejected'
                      ? 'bg-red-600 hover:bg-red-700'
                      : s === 'resolved'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))
            )}
          </div>

          {/* Assign when acknowledged */}
          {issue.status === 'acknowledged' && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-blue-600 focus:outline-none"
              >
                <option value="">Assign to staff member…</option>
                {staffMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.department ? `(${m.department})` : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAssign}
                disabled={staffActionLoading || !selectedAssignee}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
              >
                Assign
              </button>
            </div>
          )}

          {/* Priority + admin reroute */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Priority:</span>
            {PRIORITIES.map((p) => (
              <button
                key={p}
                onClick={() => handlePriority(p)}
                disabled={staffActionLoading || issue.priority === p}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors disabled:cursor-default ${
                  issue.priority === p
                    ? 'bg-gray-800 text-white'
                    : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-gray-800">Status history</h2>
        <ul className="space-y-3">
          {(issue.statusHistory?.length ? issue.statusHistory : []).map((entry, i) => (
            <li key={i} className="text-sm">
              <span className="font-semibold text-gray-800">
                {STATUS_LABELS[entry.status] || entry.status}
              </span>
              <span className="text-gray-400"> · </span>
              <time className="text-gray-500">
                {new Date(entry.timestamp).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </time>
              {entry.note && <p className="mt-0.5 text-gray-500">{entry.note}</p>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}