import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { issues, staff, getImageUrl, getApiErrorMessage } from '../services/api';
import {
  categoryByValue,
  STATUS_LABELS,
  STATUS_TRANSITIONS,
  STATUS_COLORS,
  PRIORITIES,
  PRIORITY_LABELS,
  PRIORITY_BADGE,
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

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  const fetchIssue = () => issues.get(id).then(({ data }) => setIssue(data.issue));

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

  useEffect(() => {
    let active = true;
    issues.comments
      .list(id)
      .then(({ data }) => {
        if (active) setComments(data.comments);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [id]);

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

  const handleEscalate = async () => {
    if (!canManage()) return;
    const reason = window.prompt('Why is this issue being escalated to the admin?');
    if (!reason) return;
    await runStaffAction(() => staff.escalate(id, reason.trim()));
  };

  const handleClearEscalation = async () => {
    if (!canManage()) return;
    if (!window.confirm('Clear the escalation and hand this issue back to the department?')) return;
    await runStaffAction(() => staff.clearEscalation(id));
  };

  const handleDispute = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await issues.dispute(id, disputeReason.trim());
      setDisputeReason('');
      await fetchIssue();
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not dispute resolution'));
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const text = commentText.trim();
    if (!text) return;
    setCommentSubmitting(true);
    try {
      const { data } = await issues.comments.add(id, text);
      setComments((prev) => [...prev, data.comment]);
      setCommentText('');
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not post comment'));
    } finally {
      setCommentSubmitting(false);
    }
  };

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
      else setError(e.response?.data?.message || 'Could not upvote — you may have already upvoted this');
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
    return <div className="mx-auto max-w-3xl px-4 pt-28 text-center text-slate-500">Loading...</div>;
  }

  if (error || !issue) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-28 text-center">
        <p className="mb-4 text-rose-600">{error || 'Issue not found.'}</p>
        <Link to="/map" className="btn btn-secondary !px-5 !py-2.5 !text-sm">
          Back to map
        </Link>
      </div>
    );
  }

  const category = categoryByValue(issue.category);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-24">
      <Link to="/map" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:underline">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to map
      </Link>

      <div className="glass-strong p-6 sm:p-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="chip bg-emerald-100/80 text-emerald-700">{category.label}</span>
          <span className="chip bg-white/70 text-slate-600">{issue.department || 'Admin triage'}</span>
          <span className={`chip text-white ${STATUS_COLORS[issue.status] || 'bg-amber-500'}`}>
            {STATUS_LABELS[issue.status] || issue.status}
          </span>
          {issue.priority && (
            <span className={`chip ${PRIORITY_BADGE[issue.priority]}`}>{PRIORITY_LABELS[issue.priority]}</span>
          )}
        </div>

        <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-emerald-950">{issue.title}</h1>
        {issue.description && <p className="mb-4 text-slate-600">{issue.description}</p>}

        <div className="mb-5 flex flex-wrap gap-4 text-sm font-medium text-slate-500">
          <span>{issue.address || `${issue.location.coordinates[1].toFixed(5)}, ${issue.location.coordinates[0].toFixed(5)}`}</span>
          <span>{issue.upvoteCount} upvote{issue.upvoteCount === 1 ? '' : 's'}</span>
          {issue.slaDeadline && (
            <span>
              Surge target:{' '}
              {new Date(issue.slaDeadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        {issue.images.length > 0 && (
          <div className="mb-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {issue.images.map((img) => (
              <img key={img} src={getImageUrl(img)} alt="issue evidence" className="w-full rounded-xl border border-white/80 object-cover shadow-md" />
            ))}
          </div>
        )}

        <div className="mb-5 flex flex-wrap items-center gap-3">
          {user && user.role === 'citizen' && !issue.upvotedByMe && (
            <button onClick={handleUpvote} disabled={upvoteLoading} className="btn btn-success">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
              Upvote
            </button>
          )}
          {user && user.role === 'citizen' && issue.upvotedByMe && (
            <span className="btn btn-success cursor-default opacity-90">Upvoted</span>
          )}
          {user && user.role === 'citizen' && !issue.flaggedByMe && (
            <button onClick={handleFlag} disabled={flagLoading} className="btn btn-danger">
              Flag as irrelevant
            </button>
          )}
          {user && user.role === 'citizen' && issue.flaggedByMe && (
            <span className="btn btn-danger cursor-default opacity-80">Flagged by you</span>
          )}
          {issue.flaggedAsSpam && (
            <span className="chip bg-red-600 text-white">Marked as spam by the community</span>
          )}
        </div>

        {user &&
          user.role === 'citizen' &&
          issue.submittedByMe &&
          issue.status === 'resolved' &&
          !issue.resolutionConfirmedByReporter &&
          !confirmSuccess && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 backdrop-blur">
              <h2 className="mb-1 font-bold text-emerald-900">Confirm resolution — was this complaint actually fixed?</h2>
              <p className="mb-3 text-sm text-emerald-700">
                Let Sudhar know it is resolved at this location. Optionally attach a photo as proof.
              </p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setConfirmImages(Array.from(e.target.files).map((f) => [f]))}
                className="glass-input mb-3 !text-sm"
              />
              <button onClick={handleConfirmResolution} disabled={confirmLoading} className="btn btn-success">
                {confirmLoading ? 'Confirming...' : 'Confirm resolved at this location'}
              </button>
            </div>
          )}
        {user &&
          user.role === 'citizen' &&
          issue.submittedByMe &&
          issue.status === 'resolved' &&
          (issue.resolutionConfirmedByReporter || confirmSuccess) && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 backdrop-blur">
              <p className="mb-3 font-bold text-emerald-700">You confirmed this issue is resolved.</p>
              <p className="mb-2 text-sm text-emerald-700">
                If the problem actually came back or was never properly fixed, you can dispute the resolution and reopen
                it.
              </p>
              <input
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Why are you disputing this? (optional)"
                className="glass-input mb-2 !text-sm"
              />
              <button onClick={handleDispute} className="btn btn-danger !px-4 !py-2 !text-sm">
                Dispute resolution &amp; reopen
              </button>
            </div>
          )}

        {canManage() && (
          <div className="mb-5 rounded-2xl border border-emerald-100 bg-white/40 p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold text-emerald-950">
                {user.role === 'admin' ? 'Admin actions' : `${issue.department} staff actions`}
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                Assignee: {issue.assignedTo ? issue.assignedTo.name : 'Not assigned yet'}
              </span>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-slate-600">Move to:</span>
              {nextStatuses.length === 0 ? (
                <span className="text-sm text-slate-400">No further transitions allowed.</span>
              ) : (
                nextStatuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={staffActionLoading}
                    className={`chip cursor-pointer border-0 text-white transition-transform disabled:cursor-not-allowed disabled:opacity-60 ${
                      s === 'rejected'
                        ? 'bg-gradient-to-r from-rose-600 to-orange-600 hover:scale-105'
                        : s === 'resolved'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:scale-105'
                          : 'bg-gradient-to-r from-emerald-600 to-green-700 hover:scale-105'
                    } !py-1.5 text-xs`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))
              )}
            </div>

            {issue.status === 'acknowledged' && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <select
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  className="glass-input glass-select !w-auto !py-1.5 !text-sm"
                >
                  <option value="">Assign to staff member...</option>
                  {staffMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.department ? `(${m.department})` : ''}
                    </option>
                  ))}
                </select>
                <button onClick={handleAssign} disabled={staffActionLoading || !selectedAssignee} className="btn btn-primary !px-4 !py-1.5 !text-xs">
                  Assign
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-slate-600">Priority:</span>
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  onClick={() => handlePriority(p)}
                  disabled={staffActionLoading || issue.priority === p}
                  className={`chip cursor-pointer transition-colors disabled:cursor-default ${
                    issue.priority === p
                      ? 'bg-gradient-to-br from-emerald-700 to-teal-700 text-white'
                      : 'bg-white/80 text-slate-600 hover:bg-white'
                  }`}
                >
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/60 pt-4">
              {issue.escalated ? (
                <button
                  onClick={handleClearEscalation}
                  disabled={staffActionLoading}
                  className="btn btn-primary !px-4 !py-1.5 !text-xs"
                >
                  Clear escalation (back to department)
                </button>
              ) : (
                <button
                  onClick={handleEscalate}
                  disabled={staffActionLoading}
                  className="btn btn-danger !px-4 !py-1.5 !text-xs"
                >
                  Escalate to admin
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {issue.escalated && (
        <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50/90 p-5 backdrop-blur">
          <div className="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div>
              <h2 className="font-bold text-amber-800">Escalated for admin review</h2>
              {issue.escalationReason && <p className="mt-1 text-sm text-amber-700">{issue.escalationReason}</p>}
              {issue.escalatedAt && (
                <p className="mt-1 text-xs font-medium text-amber-600/80">
                  {new Date(issue.escalatedAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="glass mt-8 p-6">
        <h2 className="mb-4 font-bold text-emerald-950">Status history</h2>
        <ul className="space-y-3">
          {(issue.statusHistory?.length ? issue.statusHistory : []).map((entry, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-emerald-950">
                    {STATUS_LABELS[entry.status] || entry.status}
                  </span>
                  <span className="font-medium text-slate-400">·</span>
                  <time className="font-medium text-slate-500">
                    {new Date(entry.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </time>
                </div>
                {entry.note && <p className="mt-0.5 text-slate-500">{entry.note}</p>}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="glass mt-8 p-6">
        <h2 className="mb-4 font-bold text-emerald-950">Discussion</h2>
        {comments.length === 0 ? (
          <p className="mb-4 text-sm text-slate-400">No comments yet — start the conversation.</p>
        ) : (
          <ul className="mb-5 space-y-4">
            {comments.map((c) => (
              <li key={c.id} className="rounded-xl bg-white/50 p-3.5">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="font-bold text-emerald-900">{c.user?.name || 'Deleted user'}</span>
                  {c.user?.role === 'staff' && <span className="chip bg-emerald-100/80 !py-0.5 text-[10px] text-emerald-700">Staff</span>}
                  {c.user?.role === 'admin' && <span className="chip bg-violet-100/80 !py-0.5 text-[10px] text-violet-700">Admin</span>}
                  <time className="ml-auto text-xs font-medium text-slate-400">
                    {new Date(c.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
                <p className="whitespace-pre-wrap text-sm text-slate-600">{c.text}</p>
              </li>
            ))}
          </ul>
        )}

        {user ? (
          <div>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Share an update about this issue..."
              className="glass-input mb-2 w-full !text-sm"
            />
            <button
              onClick={handleAddComment}
              disabled={commentSubmitting || !commentText.trim()}
              className="btn btn-success"
            >
              {commentSubmitting ? 'Posting...' : 'Post comment'}
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            <Link to="/login" className="font-bold text-emerald-600 hover:underline">
              Sign in
            </Link>{' '}
            to join the discussion.
          </p>
        )}
      </div>
    </div>
  );
}