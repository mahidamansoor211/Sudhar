import { useState, useCallback, useEffect, useRef } from 'react';

const LAHORE_DEFAULT = { lat: 31.5204, lng: 74.3587 }; // city center

// Captures the browser's GPS location. Auto-starts on mount (opt-out with autoStart=false).
export default function useGeolocation({ autoStart = true } = {}) {
  const [status, setStatus] = useState('idle'); // idle | loading | success | denied | error
  const [position, setPosition] = useState(null); // { lat, lng, accuracy }
  const [error, setError] = useState(null);
  const startedRef = useRef(false);

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      setError('Geolocation is not supported by this browser');
      return;
    }

    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setStatus('success');
      },
      (err) => {
        setStatus('denied');
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission was denied. Allow access to use GPS.'
            : err.code === err.POSITION_UNAVAILABLE
              ? 'Location unavailable, try again.'
              : 'Could not get your location.'
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    if (autoStart && !startedRef.current) {
      startedRef.current = true;
      request();
    }
  }, [autoStart, request]);

  return { status, position, error, request, defaultLocation: LAHORE_DEFAULT };
}