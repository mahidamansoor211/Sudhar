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
};
