const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');

// Demo accounts so the staff side can be tested.
const DEMO_USERS = [
  { name: 'WASA Staff', email: 'wasa@sudhar.pk', password: 'staff123', role: 'staff', department: 'WASA' },
  { name: 'LWMC Staff', email: 'lwmc@sudhar.pk', password: 'staff123', role: 'staff', department: 'LWMC' },
  { name: 'TEPA Staff', email: 'tepa@sudhar.pk', password: 'staff123', role: 'staff', department: 'TEPA' },
  { name: 'LESCO Staff', email: 'lesco@sudhar.pk', password: 'staff123', role: 'staff', department: 'LESCO' },
  { name: 'Sudhar Admin', email: 'admin@sudhar.pk', password: 'admin123', role: 'admin', department: null },
];

async function seed() {
  await connectDB();
  for (const u of DEMO_USERS) {
    const existing = await User.findOne({ email: u.email });
    const passwordHash = await bcrypt.hash(u.password, 10);
    if (existing) {
      // Reset demo accounts to the documented role/password so the demo is
      // deterministic even if an earlier account with the same email exists.
      existing.role = u.role;
      existing.department = u.department;
      existing.passwordHash = passwordHash;
      existing.isActive = true;
      await existing.save();
      console.log(`Reset:  ${u.email} (${u.role}${u.department ? '/' + u.department : ''})`);
      continue;
    }
    await User.create({ ...u, passwordHash });
    console.log(`Created: ${u.email} (${u.role}${u.department ? '/' + u.department : ''})`);
  }
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