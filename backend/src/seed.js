const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Issue = require('./models/Issue');
const Notification = require('./models/Notification');
const { computePriority } = require('./config/constants');

// Demo accounts so the staff side can be tested.
const DEMO_USERS = [
  { name: 'WASA Staff', email: 'wasa@sudhar.pk', password: 'staff123', role: 'staff', department: 'WASA' },
  { name: 'LWMC Staff', email: 'lwmc@sudhar.pk', password: 'staff123', role: 'staff', department: 'LWMC' },
  { name: 'TEPA Staff', email: 'tepa@sudhar.pk', password: 'staff123', role: 'staff', department: 'TEPA' },
  { name: 'LESCO Staff', email: 'lesco@sudhar.pk', password: 'staff123', role: 'staff', department: 'LESCO' },
  { name: 'Sudhar Admin', email: 'admin@sudhar.pk', password: 'admin123', role: 'admin', department: null },
  { name: 'Demo Citizen', email: 'demo@sudhar.pk', password: 'democitizen1', role: 'citizen', department: null },
];

async function upsertUser(u) {
  const existing = await User.findOne({ email: u.email });
  const passwordHash = await bcrypt.hash(u.password, 10);
  if (existing) {
    existing.role = u.role;
    existing.department = u.department;
    existing.passwordHash = passwordHash;
    existing.isActive = true;
    await existing.save();
    console.log(`Reset:  ${u.email} (${u.role}${u.department ? '/' + u.department : ''})`);
    return existing;
  }
  const created = await User.create({ ...u, passwordHash });
  console.log(`Created: ${u.email} (${u.role}${u.department ? '/' + u.department : ''})`);
  return created;
}

// Realistic-but-fictional Lahore issues, one per department plus an "other"
// awaiting admin triage. Coordinates are real Lahore landmarks.
const SEED_ISSUES = [
  {
    title: 'Deep pothole on Ferozepur Road near MM Alam',
    description:
      'Large pothole about 1 meter wide on the left lane heading south. Multiple cars have hit it at night and it has caused two bike falls this week.',
    category: 'pothole',
    address: 'Ferozepur Road, near MM Alam Chowk, Gulberg III',
    lng: 74.3467,
    lat: 31.5058,
    staff: 'tepa@sudhar.pk',
    ageDays: 12,
    upvotes: 9,
    statusHistory: [
      ['reported', 0],
      ['acknowledged', 2],
      ['assigned', 4],
      ['in_progress', 8],
    ],
  },
  {
    title: 'Streetlight out on Canal Road, DHA Phase 3',
    description:
      'The pole right before the traffic signal has been dark for almost a week. The whole surrounding stretch gets very dangerous for pedestrians after dark.',
    category: 'streetlight',
    address: 'Canal Road, DHA Phase 3',
    lng: 74.3822,
    lat: 31.4752,
    staff: 'lesco@sudhar.pk',
    ageDays: 6,
    upvotes: 3,
    statusHistory: [
      ['reported', 0],
      ['acknowledged', 1],
      ['assigned', 3],
    ],
  },
  {
    title: 'Garbage pile spilling onto Walton Road',
    description:
      'Waste has not been collected for four days. The heap has grown onto the road and stray animals are spreading it. Strong smell affecting nearby shops.',
    category: 'garbage',
    address: 'Walton Road, near Cavalry Ground',
    lng: 74.3185,
    lat: 31.4672,
    staff: 'lwmc@sudhar.pk',
    ageDays: 4,
    upvotes: 5,
    statusHistory: [
      ['reported', 0],
      ['acknowledged', 0],
      ['assigned', 1],
      ['in_progress', 2],
    ],
  },
  {
    title: 'Tap water running muddy near Canal View',
    description:
      'Water coming from the supply line is brown and has a foul smell. Residents near the mosque have been buying bottled water for three days.',
    category: 'water',
    address: 'Canal View Society, Bedian Road',
    lng: 74.3712,
    lat: 31.5281,
    staff: 'wasa@sudhar.pk',
    ageDays: 9,
    upvotes: 11,
    statusHistory: [
      ['reported', 0],
      ['acknowledged', 1],
      ['assigned', 3],
      ['in_progress', 5],
    ],
  },
  {
    title: 'Resolved: manhole cover replaced on Jail Road',
    description:
      'Open manhole was a hazard on the main bus route. Already fixed by WASA yesterday.',
    category: 'water',
    address: 'Jail Road, near Governor House',
    lng: 74.3482,
    lat: 31.5561,
    staff: 'wasa@sudhar.pk',
    ageDays: 20,
    upvotes: 2,
    resolved: true,
    confirmed: true,
    statusHistory: [
      ['reported', 0],
      ['acknowledged', 1],
      ['assigned', 2],
      ['in_progress', 5],
      ['resolved', 8],
    ],
  },
  {
    title: 'Broken traffic signal at Liberty Roundabout',
    description:
      'The signal has been flashing amber for days, causing long jams every evening.',
    category: 'pothole',
    address: 'Liberty Roundabout, Gulberg',
    lng: 74.3491,
    lat: 31.5113,
    staff: 'tepa@sudhar.pk',
    ageDays: 2,
    upvotes: 1,
    statusHistory: [
      ['reported', 0],
      ['acknowledged', 1],
    ],
  },
  {
    title: 'Duplicate: no streetlight on this street',
    description: 'Another report on the same pole that is already logged and being handled.',
    category: 'streetlight',
    address: 'Canal Road, DHA Phase 3',
    lng: 74.3825,
    lat: 31.4755,
    staff: 'lesco@sudhar.pk',
    ageDays: 1,
    upvotes: 0,
    statusHistory: [['reported', 0]],
  },
  {
    title: 'Unusual item at roadside near Badami Bagh',
    description:
      'Not sure which department this belongs to. Large debris pile near railway crossing.',
    category: 'other',
    address: 'Badami Bagh, near Railway Workshop',
    lng: 74.3612,
    lat: 31.5861,
    staff: null,
    ageDays: 3,
    upvotes: 0,
    statusHistory: [['reported', 0]],
  },
  {
    title: 'Rejected: spam report "buy my products"',
    description: 'Cart selling advertisement mislabeled as a pothole report.',
    category: 'pothole',
    address: 'MM Alam Road, Gulberg',
    lng: 74.3452,
    lat: 31.5142,
    staff: 'tepa@sudhar.pk',
    ageDays: 15,
    upvotes: 0,
    rejected: true,
    statusHistory: [
      ['reported', 0],
      ['rejected', 6],
    ],
  },
];

async function seedIssues(demo) {
  // Regenerate the demo citizen's demo issues + their notifications each run so
  // the demo data set is always the realistic snapshot defined above.
  const existing = await Issue.find({ reportedBy: demo._id }).select('_id');
  if (existing.length > 0) {
    await Notification.deleteMany({ issueId: { $in: existing.map((i) => i._id) } });
    await Issue.deleteMany({ _id: { $in: existing.map((i) => i._id) } });
    console.log(`Cleared ${existing.length} previous demo issues + notifications.`);
  }

  const staffByEmail = {};
  for (const u of DEMO_USERS.filter((d) => d.role === 'staff')) {
    staffByEmail[u.email] = await User.findOne({ email: u.email });
  }

  for (const s of SEED_ISSUES) {
    const created = new Date(Date.now() - s.ageDays * 24 * 60 * 60 * 1000);
    const upvotes = await User.find({ role: 'citizen', _id: { $ne: demo._id } }).limit(12);
    const upvoteIds = upvotes.slice(0, Math.min(s.upvotes, upvotes.length)).map((u) => u._id);

    const history = s.statusHistory.map(([status, offsetInDays], i) => {
      const ts = new Date(created.getTime() + offsetInDays * 24 * 60 * 60 * 1000);
      const isReport = status === 'reported';
      const who = isReport
        ? demo._id
        : s.staff
          ? staffByEmail[s.staff]?._id
          : null;
      return { status, changedBy: who, timestamp: ts, note: '' };
    });

    const issue = await Issue.create({
      reportedBy: demo._id,
      title: s.title,
      description: s.description,
      category: s.category,
      department: s.staff ? staffByEmail[s.staff]?.department : null,
      location: { type: 'Point', coordinates: [s.lng, s.lat] },
      address: s.address,
      images: [],
      status: s.rejected ? 'rejected' : s.resolved ? 'resolved' : history[history.length - 1].status,
      priority: computePriority({ category: s.category, upvoteCount: upvoteIds.length, ageMs: s.ageDays * 24 * 60 * 60 * 1000 }),
      slaDeadline: new Date(created.getTime() + { pothole: 7, streetlight: 5, garbage: 3, water: 5, other: 14 }[s.category] * 24 * 60 * 60 * 1000),
      upvotes: upvoteIds,
      resolutionConfirmedByReporter: !!s.confirmed,
      statusHistory: history,
    });

    // Backdate creation so "age" factors into priority scoring and the trend
    // chart / SLA analytics look realistic. Mongoose timestamps override
    // createdAt on create() and query updates, so bypass with the raw driver.
    const lastChange = history.length > 0 ? history[history.length - 1].timestamp : created;
    await Issue.collection.updateOne(
      { _id: issue._id },
      { $set: { createdAt: created, updatedAt: lastChange } }
    );

    // Seed notifications for the story the demo shows: status changes to the
    // reporter, plus a new-issue alert to the department staff. Written
    // directly (no socket) so the seed works without a running server.
    for (const [status, offsetInDays] of s.statusHistory) {
      if (status === 'reported') continue;
      await Notification.create({
        recipient: demo._id,
        type: 'status_change',
        issueId: issue._id,
        title: `Your report is now ${status.replace('_', ' ')}`,
        message: `"${s.title}" — status updated.`,
        createdAt: new Date(created.getTime() + offsetInDays * 24 * 60 * 60 * 1000),
      });
    }
    if (s.staff) {
      await Notification.create({
        recipient: staffByEmail[s.staff]._id,
        type: 'new_issue',
        issueId: issue._id,
        title: 'New issue in your queue',
        message: `"${s.title}" (${s.category}).`,
        createdAt: created,
      });
    }
    console.log(`Seeded issue: ${s.title} [${issue.status}]`);
  }
}

async function seed() {
  await connectDB();
  const byEmail = {};
  for (const u of DEMO_USERS) {
    const user = await upsertUser(u);
    byEmail[u.email] = user;
  }

  await seedIssues(byEmail['demo@sudhar.pk']);

  console.log('\nDemo accounts ready. Logins:');
  for (const u of DEMO_USERS) {
    console.log(`  ${u.email} / ${u.password}`);
  }
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});