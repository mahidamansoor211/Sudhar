const CATEGORY_TO_DEPARTMENT = {
  pothole: 'TEPA',
  streetlight: 'LESCO',
  garbage: 'LWMC',
  water: 'WASA',
  other: null,
};

const DEPARTMENTS = ['WASA', 'LWMC', 'TEPA', 'LESCO'];

const ROLES = ['citizen', 'staff', 'admin'];

const CATEGORIES = Object.keys(CATEGORY_TO_DEPARTMENT);

const STATUSES = [
  'reported',
  'acknowledged',
  'assigned',
  'in_progress',
  'resolved',
  'rejected',
];

const PRIORITIES = ['low', 'medium', 'high'];

const STATUS_LABELS = {
  reported: 'Reported',
  acknowledged: 'Acknowledged',
  assigned: 'Assigned',
  in_progress: 'In progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

// Enforced server-side status state machine.
// Each key maps to the only statuses it may transition TO.
const STATUS_TRANSITIONS = {
  reported: ['acknowledged', 'rejected'],
  acknowledged: ['assigned'],
  assigned: ['in_progress'],
  in_progress: ['resolved'],
  resolved: ['reported', 'acknowledged'], // reopened on dispute
  rejected: [],
};

const SLA_MS = {
  pothole: 7 * 24 * 60 * 60 * 1000,
  streetlight: 5 * 24 * 60 * 60 * 1000,
  garbage: 3 * 24 * 60 * 60 * 1000,
  water: 5 * 24 * 60 * 60 * 1000,
  other: 14 * 24 * 60 * 60 * 1000,
};

const DEFAULT_OTHER_DEPARTMENT = null;

// Automatic priority scoring: category severity + community weight (upvotes)
// + age. Higher is more urgent. Used on creation, on every upvote, and when
// the staff/admin queue is read, so priority stays current without a cron.
const PRIORITY_CATEGORY_BASE = {
  water: 3,
  pothole: 2,
  garbage: 2,
  streetlight: 1,
  other: 1,
};

const computePriority = ({ category, upvoteCount, ageMs }) => {
  const categoryBase = PRIORITY_CATEGORY_BASE[category] ?? 1;
  const upvoteScore = Math.min(4, upvoteCount || 0);
  const ageHours = Math.max(0, (ageMs || 0) / (60 * 60 * 1000));
  const ageScore = ageHours >= 48 ? 3 : ageHours >= 12 ? 2 : 0;
  const score = categoryBase + upvoteScore + ageScore;
  return score >= 6 ? 'high' : score >= 3 ? 'medium' : 'low';
};

module.exports = {
  CATEGORY_TO_DEPARTMENT,
  DEPARTMENTS,
  ROLES,
  CATEGORIES,
  STATUSES,
  PRIORITIES,
  STATUS_LABELS,
  STATUS_TRANSITIONS,
  SLA_MS,
  DEFAULT_OTHER_DEPARTMENT,
  PRIORITY_CATEGORY_BASE,
  computePriority,
};
