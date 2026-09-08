import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-bg">
          <img src="/images/hero-road.avif" alt="" className="hero-bg-image" aria-hidden="true" />
          <div className="hero-bg-overlay"></div>
        </div>
        <div className="hero-content">
          <h1 className="hero-title">
            Sudhar <span className="hero-sub">— Lahore</span>
          </h1>
          <p className="hero-subtitle">
            Report potholes, broken streetlights, garbage, and water issues in Lahore.
            We route your report to the city department that can fix it — automatically.
          </p>
          <div className="hero-actions">
            {user ? (
              <Link
                to={user.role === 'citizen' ? '/map' : '/dashboard'}
                className="btn btn-primary btn-lg"
              >
                Go to your dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Report an issue
                </Link>
                <Link to="/login" className="btn btn-secondary btn-lg">
                  Staff sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <h3>Report with proof</h3>
          <p>Snap a photo and your GPS location is captured automatically. No long forms.</p>
        </div>
        <div className="feature-card">
          <h3>Automatic routing</h3>
          <p>Pick a category and we send it straight to the right Lahore department.</p>
        </div>
        <div className="feature-card">
          <h3>Track resolution</h3>
          <p>Follow your report's status from submission to staff fix, and confirm it's done.</p>
        </div>
      </section>
    </div>
  );
}