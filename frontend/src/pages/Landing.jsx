import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DEPT_SIGILS = [
  { code: "WASA", name: "Water & Sanitation Agency", desc: "Water supply, drainage, sewage" },
  { code: "LESCO", name: "Lahore Electric Supply Co.", desc: "Streetlights, power infrastructure" },
  { code: "LWMC", name: "Lahore Waste Mgmt. Company", desc: "Garbage collection, sanitary" },
  { code: "TEPA", name: "Traffic Engineering & Planning Agency", desc: "Roads, potholes, signals" },
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
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/45 to-slate-950/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <div className="text-center">
          <span className="eyebrow mb-5 !border-white/40 !bg-white/20 !text-white drop-shadow">
            Lahore&apos;s civic issue tracker
          </span>
          <h1 className="mb-4 text-4xl font-black leading-tight tracking-tight text-white drop-shadow-md sm:text-6xl">
            A city that fixes itself,{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-green-200 to-teal-300 bg-clip-text text-transparent drop-shadow-md">
              one report at a time
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg font-medium leading-relaxed text-white drop-shadow-md">
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

          <div className="glass-strong mx-auto mt-4 max-w-3xl rounded-2xl p-5">
            <p className="mb-4 flex items-center justify-center gap-2 text-center text-base font-bold uppercase tracking-widest text-emerald-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Served by Lahore&apos;s government agencies
            </p>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {DEPT_SIGILS.map((d) => (
                <div
                  key={d.code}
                  className="group rounded-xl border border-emerald-200/70 bg-white/70 p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                >
                  <p className="text-lg font-black tracking-wide text-emerald-800">{d.code}</p>
                  <p className="mt-1 text-xs font-bold uppercase leading-tight text-slate-600">{d.name}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{d.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}