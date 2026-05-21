import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import BrandHomeLink from "../BrandHomeLink";

function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [pwd, setPwd] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const { signInUser } = UserAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrMsg("");

    if (!identifier || !pwd) {
      setErrMsg("Wrong input: enter username/email and password.");
      return;
    }

    setLoading(true);
    const result = await signInUser(identifier, pwd);
    setLoading(false);

    if (!result.success) {
      setErrMsg(result.error?.message || "Login failed.");
      return;
    }

    navigate("/");
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-3 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[calc(5.25rem+env(safe-area-inset-top))] text-white sm:px-6 sm:pt-28">
      <BrandHomeLink />
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/80 shadow-2xl sm:rounded-3xl md:grid-cols-2">
        <div className="flex flex-col justify-between bg-gradient-to-br from-cyan-600/30 to-fuchsia-500/20 p-6 sm:p-8 md:p-10">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">
              Pick Fashion
            </p>
            <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
              Welcome Back
            </h1>
            <p className="mt-4 text-slate-200">
              Sign in to buy products and manage your tracking updates.
            </p>
          </div>
          <p className="text-sm text-slate-300">
            Style curated for modern taste.
          </p>
        </div>

        <section className="p-5 sm:p-8 md:p-10">
          <h2 className="text-2xl font-bold">Login to your account</h2>
          <p className="mt-2 text-sm text-slate-300">
            Use your registered Pick Fashion email or username.
          </p>

          {errMsg && (
            <p className="mt-4 rounded-md border border-rose-300/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
              {errMsg}
            </p>
          )}

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm text-slate-200">Email or Username</span>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="min-h-[48px] w-full rounded-md border border-slate-600 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400"
                placeholder="you@example.com or username"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-slate-200">Password</span>
              <input
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                className="min-h-[48px] w-full rounded-md border border-slate-600 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400"
                placeholder="Enter password"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="touch-action-manipulation min-h-[48px] w-full rounded-md bg-cyan-500 px-4 py-3 text-base font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-300">
            New to Pick Fashion?{" "}
            <Link to="/register" className="font-semibold text-cyan-300">
              Create account
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}

export default Login;
