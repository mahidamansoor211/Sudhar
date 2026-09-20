import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { issues, getApiErrorMessage, getImageUrl } from '../services/api';
import useGeolocation from '../hooks/useGeolocation';
import LocationPickerMap from '../components/LocationPickerMap';
import { CATEGORIES } from '../utils/constants';

const stepHead = (n, title) => (
  <div className="mb-3 flex items-center gap-2.5">
    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 text-sm font-extrabold text-white shadow-md shadow-emerald-600/30">
      {n}
    </span>
    <h2 className="font-bold text-emerald-950">{title}</h2>
  </div>
);

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
      const { data } = await issues.checkDuplicates({ lat: location.lat, lng: location.lng, category });
      setDuplicates(data);
    } catch {
      setDuplicates({ duplicates: [] });
    } finally {
      setCheckingDupes(false);
    }
  }, [location, category]);

  useEffect(() => {
    setDuplicates(null);
    checkForDuplicates();
  }, [checkForDuplicates]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!location) return setError('Add your location using the map before submitting');
    if (!category) return setError('Pick a category for the issue');
    if (photos.length === 0) return setError('Attach at least one photo as evidence');

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

  const inputClass = 'glass-input';

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-24">
      <div className="mb-8">
        <span className="eyebrow mb-3">New report</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-emerald-950">Report an issue</h1>
        <p className="mt-1 text-slate-500">Add evidence, pick a category — it routes to the right Lahore department.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm font-medium text-rose-600 backdrop-blur">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="glass p-6 sm:p-7">
          {stepHead(1, 'Photo evidence')}
          <p className="mb-4 text-sm text-slate-500">Use your camera or gallery. Up to 5 photos.</p>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-2xl border-2 border-dashed border-emerald-300 bg-white/50 px-4 py-9 text-center text-slate-500 backdrop-blur transition-colors hover:border-emerald-400 hover:bg-emerald-50/50"
          >
            <span className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            <p className="font-semibold">Tap to open your camera</p>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" multiple onChange={handlePhotoChange} className="hidden" />

          {photoPreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-5">
              {photoPreviews.map((src, i) => (
                <div key={src} className="group relative">
                  <img src={src} alt={`photo ${i + 1}`} className="h-24 w-full rounded-xl object-cover shadow-md" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white transition-colors hover:bg-rose-600"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="glass p-6 sm:p-7">
          {stepHead(2, 'What type of issue?')}
          <p className="mb-4 text-sm text-slate-500">We route your report to the responsible department automatically.</p>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {CATEGORIES.map((c) => {
              const selected = category === c.value;
              return (
                <label
                  key={c.value}
                  className={`card-hover cursor-pointer rounded-2xl border-2 p-3.5 transition-colors ${
                    selected
                      ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg shadow-emerald-200/60'
                      : 'border-white/90 bg-white/40 hover:border-emerald-300'
                  }`}
                >
                  <input type="radio" name="category" value={c.value} checked={selected} onChange={(e) => setCategory(e.target.value)} className="hidden" />
                  <span className="flex items-center gap-2 font-bold text-emerald-950">
                    <span className={`h-2.5 w-2.5 rounded-full ${selected ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                    {c.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">{c.description}</span>
                  {c.department && <span className="chip mt-2 bg-emerald-100/80 text-emerald-700">{c.department}</span>}
                </label>
              );
            })}
          </div>
        </section>

        <section className="glass p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {stepHead(3, 'Location')}
            <button type="button" onClick={requestGps} className="btn btn-secondary !px-4 !py-2 !text-xs">
              Use my GPS location
            </button>
          </div>
          <p className="mb-3 text-sm text-slate-500">Tap the map to adjust, or get your position with GPS.</p>

          <div className="map-well">
            <LocationPickerMap position={location} onSelect={setLocation} />
          </div>

          <div className="mt-3 text-sm font-medium">
            {location ? (
              <span className="rounded-xl bg-emerald-50/90 px-3 py-1.5 text-emerald-700">
                {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </span>
            ) : (
              <span className="rounded-xl bg-amber-50/90 px-3 py-1.5 text-amber-700">
                {gpsStatus === 'loading' ? 'Fetching your location...' : gpsStatus === 'denied' ? gpsError : 'No location set — allow GPS or tap the map.'}
              </span>
            )}
          </div>
        </section>

        <section className="glass p-6 sm:p-7">
          {stepHead(4, 'Details')}

          <label className="mb-4 flex flex-col gap-1.5">
            <span className="text-sm font-bold text-emerald-900">Title</span>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={140} placeholder="e.g. Large pothole on Main Boulevard" className={inputClass} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-emerald-900">Description (optional)</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} rows={3} placeholder="Add more detail so the department can find it" className={`${inputClass} resize-none`} />
          </label>
        </section>

        {checkingDupes && (
          <div className="glass-strong px-4 py-3 text-sm font-medium text-slate-500">
            Checking for nearby identical reports...
          </div>
        )}

        {duplicates && duplicates.count > 0 && !submitting && (
          <div className="glass-strong border-amber-200 p-5">
            <h3 className="mb-2 font-bold text-amber-700">
              {duplicates.count} similar report{duplicates.count > 1 ? 's' : ''} nearby
            </h3>
            <p className="mb-3 text-sm text-amber-600">
              Someone already reported this. Upvoting helps it get fixed faster than filing a duplicate.
            </p>
            <ul className="mb-3 space-y-2">
              {duplicates.duplicates.map((d) => (
                <li key={d.id} className="flex items-center gap-2.5 rounded-xl bg-white/60 px-3 py-2">
                  {d.image ? <img src={getImageUrl(d.image)} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <span className="h-10 w-10 rounded-lg bg-slate-200" />}
                  <div className="min-w-0 flex-1">
                    <Link to={`/issues/${d.id}`} className="block truncate text-sm font-bold text-slate-800 hover:underline">{d.title}</Link>
                    <span className="text-xs text-slate-500">{d.upvoteCount} upvote{d.upvoteCount === 1 ? '' : 's'}</span>
                  </div>
                  <Link to={`/issues/${d.id}`} className="btn btn-success !px-4 !py-2 !text-sm">Upvote</Link>
                </li>
              ))}
            </ul>
            <button type="submit" className="btn btn-secondary !px-4 !py-2 !text-sm">Report anyway</button>
          </div>
        )}

        <button type="submit" disabled={submitting} className="btn btn-primary w-full !py-4 text-lg">
          {submitting ? 'Submitting...' : 'Submit report'}
        </button>
      </form>
    </div>
  );
}