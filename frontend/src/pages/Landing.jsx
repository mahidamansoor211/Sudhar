import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PILLARS = [
  {
    label: "Report with proof",
    desc: "Photo + GPS in one tap",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: "Automatic routing",
    desc: "Straight to the right department",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 7l5 5-5 5" />
      </svg>
    ),
  },
  {
    label: "Track resolution",
    desc: "Follow it until it's confirmed fixed",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden px-4 pb-10 pt-20 sm:px-6 sm:pt-24">
      {/* The photo, in its original color — no green wash, no heavy darkening */}
      <div className="map-well absolute inset-4 sm:inset-6">
        <img
          src="/images/hero-road.avif"
          alt="Lahore road"
          aria-hidden="true"
          className="h-full w-full object-cover"
        />
        {/* Light, localized scrim only where the text sits, so the photo stays visible */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/55 via-slate-950/25 to-slate-950/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <div className="text-center">
          <span className="eyebrow mb-5 !border-white/35 !bg-white/15 !text-white">
            Lahore&apos;s civic issue tracker
          </span>
          <h1 className="mb-4 text-4xl font-black leading-tight tracking-tight text-white sm:text-6xl">
            A city that fixes itself,{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-green-200 to-teal-300 bg-clip-text text-transparent">
              one report at a time
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-white/95">
            Report potholes, broken streetlights, garbage and water issues in Lahore.
            We route your report to the department that can fix it — automatically.
          </p>

          <div className="mb-9 flex flex-wrap justify-center gap-4">
            {user ? (
              <Link to={user.role === "citizen" ? "/map" : "/dashboard"} className="btn btn-primary px-8 py-3.5 text-lg">
                Go to your dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary px-8 py-3.5 text-lg">Report an issue</Link>
                <Link to="/login" className="btn !border !border-white/50 !bg-white/20 text-lg text-white backdrop-blur-lg hover:!bg-white/30">
                  Staff sign in
                </Link>
              </>
            )}
          </div>

          <div className="glass-strong grid max-w-2xl grid-cols-1 gap-3 rounded-2xl p-4 sm:mx-auto sm:grid-cols-3">
            {PILLARS.map((p) => (
              <div key={p.label} className="flex items-center gap-3 text-left">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30">
                  {p.icon}
                </span>
                <div>
                  <p className="text-sm font-bold text-emerald-900">{p.label}</p>
                  <p className="text-xs text-slate-500">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white/85">
            Served by
            {["WASA", "LESCO", "LWMC", "TEPA"].map((d) => (
              <span key={d} className="chip bg-white/20 text-white">{d}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}