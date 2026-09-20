export const CATEGORIES = [
  { value: 'pothole', label: 'Pothole', description: 'Road damage on streets or highways', department: 'TEPA' },
  { value: 'streetlight', label: 'Streetlight', description: 'Broken or dark street lights', department: 'LESCO' },
  { value: 'garbage', label: 'Garbage', description: 'Uncollected waste or overflowing bins', department: 'LWMC' },
  { value: 'water', label: 'Water / Drainage', description: 'Water leak, sewage or flooded drain', department: 'WASA' },
  { value: 'other', label: 'Other', description: 'Anything else — reviewed by an admin', department: null },
];

export const categoryByValue = (value) =>
  CATEGORIES.find((c) => c.value === value) || CATEGORIES[CATEGORIES.length - 1];

export const DEPARTMENT_COLORS = {
  TEPA: 'bg-orange-500',
  LESCO: 'bg-yellow-500',
  LWMC: 'bg-emerald-500',
  WASA: 'bg-sky-500',
  null: 'bg-purple-500',
};

export const CATEGORY_MARKER_COLORS = {
  pothole: 'orange',
  streetlight: 'yellow',
  garbage: 'green',
  water: 'blue',
  other: 'purple',
};

export const STATUS_LABELS = {
  reported: 'Reported',
  acknowledged: 'Acknowledged',
  assigned: 'Assigned',
  in_progress: 'In progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

export const STATUS_TRANSITIONS = {
  reported: ['acknowledged', 'rejected'],
  acknowledged: ['assigned'],
  assigned: ['in_progress'],
  in_progress: ['resolved'],
  resolved: ['reported', 'acknowledged'],
  rejected: [],
};

export const PRIORITIES = ['low', 'medium', 'high'];

export const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const STATUS_COLORS = {
  reported: 'bg-gray-500',
  acknowledged: 'bg-blue-500',
  assigned: 'bg-indigo-500',
  in_progress: 'bg-amber-500',
  resolved: 'bg-green-600',
  rejected: 'bg-red-600',
};

export const PRIORITY_BADGE = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
};