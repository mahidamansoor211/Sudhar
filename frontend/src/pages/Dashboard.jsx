import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  const title =
    user.role === 'staff' ? `${user.department} Staff Dashboard` : 'Admin Dashboard';

  return (
    <div className="mx-auto max-w-4xl px-5 pb-8 pt-24">
      <h1 className="mb-3 text-2xl font-bold text-gray-800">{title}</h1>
      <p className="mb-3 text-gray-500">
        Welcome back, {user.name}. This area is under construction — the issue queue
        (staff) and analytics (admin) arrive in later phases.
      </p>
      <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
        {user.role === 'staff' ? `Department: ${user.department}` : 'Cross-department oversight'}
      </span>
    </div>
  );
}