import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { issues, getApiErrorMessage, getImageUrl } from '../services/api';
import useGeolocation from '../hooks/useGeolocation';
import LocationPickerMap from '../components/LocationPickerMap';
import { CATEGORIES } from '../utils/constants';

export default function ReportIssue() {
  const navigate = useNavigate();
  const { status: gpsStatus, position, error: gpsError, request: requestGps } = useGeolocation();

  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [location, setLocation] = useState(null);
  const [duplicates, setDuplicates] = useState(null);
  const [checkingDupes, setCheckingDupes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Adopt browser GPS when it arrives.
  useEffect(() => {
    if (position && !location) {
      setLocation({ lat: position.lat, lng: position.lng });
    }
  }, [position, location]);

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files || []);
    setPhotos((prev) => [...prev, ...files].slice(0, 5));
    const previews = files.map((f) => URL.createObjectURL(f));
    setPhotoPreviews((prev) => [...prev, ...previews].slice(0, 5));
  };

  const removePhoto = (idx) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPhotoPreviews((prev) => {
      try {
        URL.revokeObjectURL(prev[idx]);
      } catch {}
      return prev.filter((_, i) => i !== idx);
    });
  };

  const checkForDuplicates = useCallback(async () => {
    if (!location || !category) return;
    setCheckingDupes(true);
    try {
      const { data } = await issues.checkDuplicates({
        lat: location.lat,
        lng: location.lng,
        category,
      });
      setDuplicates(data);
    } catch {
      setDuplicates({ duplicates: [] });
    } finally {
      setCheckingDupes(false);
    }
  }, [location, category]);

  // Re-check duplicates whenever location or category changes.
  useEffect(() => {
    setDuplicates(null);
    checkForDuplicates();
  }, [checkForDuplicates]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!location) {
      setError('Add your location using the map before submitting');
      return;
    }
    if (!category) {
      setError('Pick a category for the issue');
      return;
    }
    if (photos.length === 0) {
      setError('Attach at least one photo as evidence');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('description', description);
      fd.append('category', category);
      fd.append('lng', location.lng);
      fd.append('lat', location.lat);
      photos.forEach((p) => fd.append('images', p));

      const { data } = await issues.create(fd);
      navigate(`/issues/${data.issue.id}`, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not submit the issue'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-24">
      <h1 className="mb-1 text-2xl font-bold text-gray-800">Report an issue</h1>
      <p className="mb-6 text-gray-500">Add evidence, pick a category, and it routes to the right Lahore department.</p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-600 bg-red-100 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Photos */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 font-semibold text-gray-800">1. Photo evidence</h2>
          <p className="mb-3 text-sm text-gray-500">Use your camera or gallery. Up to 5 photos.</p>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-gray-500 transition-colors hover:border-blue-400 hover:bg-blue-50"
          >
            📷 Tap to open your camera
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handlePhotoChange}
            className="hidden"
          />

          {photoPreviews.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {photoPreviews.map((src, i) => (
                <div key={src} className="relative">
                  <img src={src} alt={`photo ${i + 1}`} className="h-24 w-full rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 px-2 text-xs text-white"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Step 2: Category */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 font-semibold text-gray-800">2. What type of issue?</h2>
          <p className="mb-3 text-sm text-gray-500">We route your report to the responsible department automatically.</p>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {CATEGORIES.map((c) => (
              <label
                key={c.value}
                className={`cursor-pointer rounded-lg border-2 p-3 transition-colors ${
                  category === c.value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value={c.value}
                  checked={category === c.value}
                  onChange={(e) => setCategory(e.target.value)}
                  className="hidden"
                />
                <span className="block font-semibold text-gray-800">{c.label}</span>
                <span className="block text-xs text-gray-500">{c.description}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Step 3: Location */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">3. Location</h2>
            <button
              type="button"
              onClick={requestGps}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              📍 Use my GPS location
            </button>
          </div>
          <p className="mb-3 text-sm text-gray-500">
            Tap the map to adjust, or get your position with the GPS button.
          </p>

          <LocationPickerMap position={location} onSelect={setLocation} />

          <div className="mt-2 text-sm">
            {location ? (
              <span className="text-green-700">📍 {location.lat.toFixed(5)}, {location.lng.toFixed(5)}</span>
            ) : (
              <span className="text-orange-600">
                {gpsStatus === 'loading'
                  ? 'Fetching your location…'
                  : gpsStatus === 'denied'
                    ? gpsError
                    : 'No location set — allow GPS or tap the map.'}
              </span>
            )}
          </div>
        </section>

        {/* Step 4: Details */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-gray-800">4. Details</h2>

          <label className="mb-3 flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-gray-800">Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={140}
              placeholder="e.g. Large pothole on Main Boulevard"
              className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-gray-800">Description (optional)</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Add more detail so the department can find it"
              className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </label>
        </section>

        {/* Duplicate prompt */}
        {checkingDupes && (
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 shadow-sm">
            Checking for nearby identical reports…
          </div>
        )}
        {duplicates && duplicates.count > 0 && !submitting && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-sm">
            <h3 className="mb-2 font-semibold text-amber-800">
              ⚠️ {duplicates.count} similar report{duplicates.count > 1 ? 's' : ''} nearby
            </h3>
            <p className="mb-3 text-sm text-amber-700">
              Someone already reported this. Upvoting helps it get fixed faster than filing a duplicate.
            </p>
            <ul className="mb-3 space-y-2">
              {duplicates.duplicates.map((d) => (
                <li key={d.id} className="flex items-center gap-2">
                  {d.image ? (
                    <img src={getImageUrl(d.image)} alt="" className="h-10 w-10 rounded object-cover" />
                  ) : (
                    <span className="h-10 w-10 rounded bg-gray-200" />
                  )}
                  <div className="min-w-0 flex-1">
                    <Link to={`/issues/${d.id}`} className="block truncate text-sm font-semibold text-gray-800 hover:underline">
                      {d.title}
                    </Link>
                    <span className="text-xs text-gray-500">▲ {d.upvoteCount} upvote{d.upvoteCount === 1 ? '' : 's'}</span>
                  </div>
                  <button type="button" className="rounded-lg border border-green-600 bg-white px-2.5 py-1 text-sm font-semibold text-green-700 hover:bg-green-50">
                    Upvote
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="submit"
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Report anyway
            </button>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-blue-600 px-4 py-3.5 text-lg font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit report'}
        </button>
      </form>
    </div>
  );
}