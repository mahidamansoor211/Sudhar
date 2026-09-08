import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MapView() {
  const { user } = useAuth();

  return (
    <div className="map-view">
      <div className="map-placeholder">
        <p>The live issue map arrives in Phase 2.</p>
        <p className="muted">Leaflet.js with marker clustering will render here.</p>
      </div>
      {user && (
        <div className="map-cta">
          <Link to="/report" className="btn btn-primary">
            Report an issue
          </Link>
        </div>
      )}
    </div>
  );
}