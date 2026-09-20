import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../services/api';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setSubmitting(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      navigate('/map', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not create account'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-24">
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/25 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-teal-400/25 blur-3xl" />

      <div className="glass-strong card-hover w-full max-w-md p-8 sm:p-10">
        <div className="mb-7 text-center">
          <img src="/images/logo.png" alt="Sudhar logo" className="mx-auto mb-4 h-16 w-auto" />
          <h1 className="text-3xl font-extrabold tracking-tight text-emerald-950">Create your account</h1>
          <p className="mt-1 text-slate-500">Report issues and track their resolution</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm font-medium text-rose-600 backdrop-blur">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-emerald-900">Full name</span>
            <input type="text" name="name" value={form.name} onChange={handleChange} required autoComplete="name" placeholder="Your name" className="glass-input" />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-emerald-900">Email</span>
            <input type="email" name="email" value={form.email} onChange={handleChange} required autoComplete="email" placeholder="you@example.com" className="glass-input" />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-emerald-900">Password</span>
            <input type="password" name="password" value={form.password} onChange={handleChange} required autoComplete="new-password" placeholder="At least 8 characters" className="glass-input" />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-emerald-900">Confirm password</span>
            <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required autoComplete="new-password" placeholder="Re-enter password" className="glass-input" />
          </label>

          <button type="submit" disabled={submitting} className="btn btn-primary w-full">
            {submitting ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-emerald-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}