import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import BrandHomeLink from "../BrandHomeLink";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const USER_REGEX = /^[A-Za-z][A-Za-z0-9_]{4,29}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%<>]).{8,24}$/;

function Register() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState("");
  const [pwd, setPwd] = useState("");
  const [matchPwd, setMatchPwd] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(true);
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState("idle");

  const { signUpNewUser, checkUsernameAvailability } = UserAuth();

  useEffect(() => {
    if (!user.trim()) {
      setUsernameStatus("idle");
      return;
    }
    if (!USER_REGEX.test(user)) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      const result = await checkUsernameAvailability(user);
      if (result.reason === "error") {
        setUsernameStatus("error");
      } else if (result.available) {
        setUsernameStatus("available");
      } else {
        setUsernameStatus("unavailable");
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [user, checkUsernameAvailability]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validEmail = EMAIL_REGEX.test(email);
    const validName = USER_REGEX.test(user);
    const validPwd = PWD_REGEX.test(pwd);
    const validMatch = pwd === matchPwd;

    if (!validEmail || !validName || !validPwd || !validMatch) {
      setErrMsg("Please enter valid account details.");
      return;
    }

    if (usernameStatus !== "available") {
      setErrMsg(
        "Wait for a valid, available username or fix the username field.",
      );
      return;
    }

    setErrMsg("");
    setLoading(true);

    try {
      const result = await signUpNewUser(email, pwd, user);
      setLoading(false);

      if (result.success) {
        setNeedsEmailConfirmation(Boolean(result.needsEmailConfirmation));
        setEmail("");
        setUser("");
        setPwd("");
        setMatchPwd("");
        setUsernameStatus("idle");
        setSuccess(true);
      } else {
        setErrMsg(result.error?.message || "Registration Failed");
      }
    } catch (error) {
      setLoading(false);
      setErrMsg("Registration Failed");
    }
  };

  const usernameHint = () => {
    switch (usernameStatus) {
      case "idle":
        return null;
      case "invalid":
        return (
          <p className="text-sm text-amber-200">
            Username must be 5–30 characters, start with a letter, and use
            letters, numbers, or underscores only.
          </p>
        );
      case "checking":
        return <p className="text-sm text-slate-400">Checking username…</p>;
      case "available":
        return (
          <p className="text-sm text-emerald-300">Username is available.</p>
        );
      case "unavailable":
        return (
          <p className="text-sm text-rose-200">
            Username is already taken. Try another.
          </p>
        );
      case "error":
        return (
          <p className="text-sm text-rose-200">
            Could not check username. Confirm you ran{" "}
            <code className="text-xs">supabase/profiles.sql</code> in the
            Supabase SQL editor.
          </p>
        );
      default:
        return null;
    }
  };

  const canSubmit =
    EMAIL_REGEX.test(email) &&
    USER_REGEX.test(user) &&
    PWD_REGEX.test(pwd) &&
    pwd === matchPwd &&
    usernameStatus === "available";

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-3 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[calc(5.25rem+env(safe-area-inset-top))] text-white sm:px-6 sm:pt-28">
      <BrandHomeLink />
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/80 shadow-2xl sm:rounded-3xl md:grid-cols-2">
        <div className="flex flex-col justify-between bg-gradient-to-br from-fuchsia-600/30 to-cyan-500/20 p-6 sm:p-8 md:p-10">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">
              Pick Fashion
            </p>
            <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
              Create Account
            </h1>
            <p className="mt-4 text-slate-200">
              Join Pick Fashion to buy products and track your orders.
            </p>
          </div>
          <p className="text-sm text-slate-300">
            Fashion finds, ready when you are.
          </p>
        </div>

        <section className="p-5 sm:p-8 md:p-10">
          {success ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Registration successful</h2>
              {needsEmailConfirmation ? (
                <>
                  <p className="text-slate-300">
                    Check your email for a confirmation link from Pick Fashion.
                    You must confirm your email before you can log in.
                  </p>
                </>
              ) : (
                <p className="text-slate-300">
                  Your account is ready. You can log in now.
                </p>
              )}
              <Link
                to="/login"
                className="inline-block rounded-md bg-cyan-500 px-5 py-2 font-semibold text-slate-950"
              >
                Go to login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold">Create your account</h2>
              <p className="mt-2 text-sm text-slate-300">
                Register to unlock buying and tracking.
              </p>

              {errMsg && (
                <p className="mt-4 rounded-md border border-rose-300/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
                  {errMsg}
                </p>
              )}

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="min-h-[48px] w-full rounded-md border border-slate-600 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400"
                  placeholder="Email"
                />
                <div className="space-y-2">
                  <input
                    type="text"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    className="min-h-[48px] w-full rounded-md border border-slate-600 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400"
                    placeholder="Username"
                    autoComplete="username"
                  />
                  {usernameHint()}
                </div>
                <input
                  type="password"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  className="min-h-[48px] w-full rounded-md border border-slate-600 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400"
                  placeholder="Password"
                />
                <input
                  type="password"
                  value={matchPwd}
                  onChange={(e) => setMatchPwd(e.target.value)}
                  className="min-h-[48px] w-full rounded-md border border-slate-600 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400"
                  placeholder="Confirm password"
                />
                {matchPwd && pwd !== matchPwd && (
                  <p className="text-sm text-amber-200">
                    Password unmatched: confirmation must match password.
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading || !canSubmit}
                  className="touch-action-manipulation min-h-[48px] w-full rounded-md bg-cyan-500 px-4 py-3 text-base font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Creating account..." : "Create account"}
                </button>
              </form>

              <p className="mt-6 text-sm text-slate-300">
                Already registered?{" "}
                <Link to="/login" className="font-semibold text-cyan-300">
                  Login
                </Link>
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default Register;
