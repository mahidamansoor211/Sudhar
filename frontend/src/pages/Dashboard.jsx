import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  const title =
    user.role === 'staff' ? `${user.department} Staff Dashboard` : 'Admin Dashboard';

  return (
    <div className="dashboard">
      <h1>{title}</h1>
      <p>
        Welcome back, {user.name}. This area is under construction — the issue queue
        (staff) and analytics (admin) arrive in later phases.
      </p>
      <p className="role-badge">{user.role === 'staff' ? `Department: ${user.department}` : 'Cross-department oversight'}</p>
    </div>
  );
}