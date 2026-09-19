import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const featureCardClass =
  "rounded-xl border border-gray-200 bg-white p-6 shadow-sm";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div>
      <section className="relative flex min-h-[1100px] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-road.avif"
            alt=""
            aria-hidden="true"
            className="h-full w-full scale-105 object-cover blur-[1px] brightness-[0.55]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 to-black/60"></div>
        </div>

        <div className="relative z-10 max-w-3xl px-5 py-16 text-center text-white">
          <h1 className="mb-4 text-3xl font-bold sm:text-5xl">
            Sudhar <span className="font-medium text-white/75">— Lahore</span>
          </h1>
          <p className="mb-8 text-lg leading-relaxed text-white/90 sm:text-xl">
            Report potholes, broken streetlights, garbage, and water issues in
            Lahore. We route your report to the city department that can fix it
            — automatically.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {user ? (
              <Link
                to={user.role === "citizen" ? "/map" : "/dashboard"}
                className="rounded-lg bg-blue-600 px-7 py-3.5 text-lg font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Go to your dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="rounded-lg bg-blue-600 px-7 py-3.5 text-lg font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Report an issue
                </Link>
                <Link
                  to="/login"
                  className="rounded-lg bg-green-600 px-7 py-3.5 text-lg font-semibold text-white transition-colors hover:bg-green-700"
                >
                  Staff sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-4xl grid-cols-1 gap-5 px-5 pb-16 pt-6 sm:grid-cols-3">
        <div className={featureCardClass}>
          <h3 className="mb-2 text-lg font-semibold text-gray-800">
            Report with proof
          </h3>
          <p className="text-gray-500">
            Snap a photo and your GPS location is captured automatically. No
            long forms.
          </p>
        </div>
        <div className={featureCardClass}>
          <h3 className="mb-2 text-lg font-semibold text-gray-800">
            Automatic routing
          </h3>
          <p className="text-gray-500">
            Pick a category and we send it straight to the right Lahore
            department.
          </p>
        </div>
        <div className={featureCardClass}>
          <h3 className="mb-2 text-lg font-semibold text-gray-800">
            Track resolution
          </h3>
          <p className="text-gray-500">
            Follow your report's status from submission to staff fix, and
            confirm it's done.
          </p>
        </div>
      </section>
    </div>
  );
}
