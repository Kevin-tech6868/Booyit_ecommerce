import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Check, AlertCircle } from "lucide-react";

const SESSION_KEY = "session"; // who is currently signed in (never stores the password)
const LOCK_KEY = "loginLockUntil"; // timestamp (ms) until which sign-in is locked

const MAX_ATTEMPTS = 5; // wrong tries allowed before a lockout
const LOCK_SECONDS = 30; // how long the lockout lasts

// Where the backend is listening (see Backend/server.js)
const API_URL = "http://localhost:4000";

// Same email rules as the create-account page
const EMAIL_REGEX =
  /^(?!.*\.\.)[A-Za-z0-9](?:[A-Za-z0-9._%+-]*[A-Za-z0-9])?@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;

function validateEmail(email) {
  const trimmed = email.trim();
  if (!trimmed) return "Email is required.";
  if ((trimmed.match(/@/g) || []).length !== 1) {
    return "Email must contain exactly one @.";
  }
  const [local, domain] = trimmed.split("@");
  if (local.length > 64) return "The part before @ is too long.";
  if (domain.length > 255) return "The domain part is too long.";
  if (!domain.includes(".")) {
    return "Email must have a proper domain, like example.com.";
  }
  if (!EMAIL_REGEX.test(trimmed)) return "Enter a valid email address.";
  return "";
}

// On login we only check that a password was entered. The complexity rules
// belong to sign-up; re-checking them here would leak the rules to attackers
// and lock out anyone whose password predates a rule change.
function validatePassword(password) {
  if (!password) return "Password is required.";
  return "";
}

/**
 * Checks the email + password against accounts.json via the backend.
 * Returns the account on success, or throws an Error describing why it failed:
 * "not_found" when there's no account for that email at all,
 * "wrong_password" when the email exists but the password doesn't match.
 */
async function findAccount(email, password) {
  let res;
  try {
    res = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
  } catch {
    const err = new Error("Couldn't reach the server. Is the backend running?");
    err.code = "network";
    throw err;
  }

  if (res.status === 401) {
    const err = new Error("No account found for this email. Please create an account first.");
    err.code = "not_found";
    throw err;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || "Something went wrong. Please try again.");
    err.code = "server";
    throw err;
  }

  return res.json(); // { name, email }
}

function saveSession(account) {
  try {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        name: account.name,
        email: account.email,
        signedInAt: new Date().toISOString(),
      })
    );
    // Tell the Navbar (and anything else listening) that the session changed
    window.dispatchEvent(new Event("sessionchange"));
  } catch {
    /* storage unavailable — sign-in still succeeds for this visit */
  }
}

function readLockUntil() {
  try {
    const n = parseInt(localStorage.getItem(LOCK_KEY), 10);
    return Number.isFinite(n) && n > Date.now() ? n : 0;
  } catch {
    return 0;
  }
}

function SuccessModal({ name, email, onClose }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <Check className="h-6 w-6 text-emerald-600" />
        </div>
        <h2 id="signin-title" className="text-center text-lg font-semibold text-slate-900">
          Signed in successfully
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Welcome back, {name.split(" ")[0]}. You're signed in as {email}.
        </p>

        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export default function Login({ onSwitchToSignup, onSuccess }) {
  const [values, setValues] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(() => readLockUntil());
  const [now, setNow] = useState(() => Date.now());
  const [signedInAs, setSignedInAs] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const secondsLeft = Math.max(0, Math.ceil((lockUntil - now) / 1000));
  const locked = secondsLeft > 0;

  // Tick once a second while locked, then clear the lock when it expires
  useEffect(() => {
    if (!lockUntil) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= lockUntil) {
        setLockUntil(0);
        setFormError("");
        try {
          localStorage.removeItem(LOCK_KEY);
        } catch {
          /* ignore */
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, [lockUntil]);

  const errors = {
    email: validateEmail(values.email),
    password: validatePassword(values.password),
  };
  const isValid = Object.values(errors).every((e) => !e);

  function handleChange(field) {
    return (e) => {
      setValues((v) => ({ ...v, [field]: e.target.value }));
      if (formError) setFormError("");
    };
  }

  function handleBlur(field) {
    return () => setTouched((t) => ({ ...t, [field]: true }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (locked || submitting) return;

    setTouched({ email: true, password: true });
    if (!isValid) return;

    setSubmitting(true);
    setFormError("");

    try {
      const account = await findAccount(values.email, values.password);
      saveSession(account);
      setAttempts(0);
      setSignedInAs(account);
      onSuccess?.(account);
    } catch (err) {
      if (err.code === "network" || err.code === "server") {
        // Server/connection problems aren't a failed login attempt —
        // don't count them toward the lockout.
        setFormError(err.message);
        return;
      }

      // err.code is "not_found" here — no account exists for this email/password combo
      const nextAttempts = attempts + 1;
      setValues((v) => ({ ...v, password: "" }));

      if (nextAttempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCK_SECONDS * 1000;
        try {
          localStorage.setItem(LOCK_KEY, String(until));
        } catch {
          /* ignore */
        }
        setAttempts(0);
        setNow(Date.now());
        setLockUntil(until);
        setFormError("");
      } else {
        setAttempts(nextAttempts);
        setFormError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleModalClose() {
    setSignedInAs(null);
    setValues({ email: "", password: "" });
    setTouched({});
    setShowPassword(false);
    navigate("/");
  }

  const inputClass = (field) =>
    `w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none transition focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 ${
      touched[field] && errors[field]
        ? "border-red-300 focus:ring-red-200"
        : "border-slate-300 focus:ring-slate-200"
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">Enter your email and password to continue.</p>

        {locked && (
          <div
            role="alert"
            className="mt-6 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Too many failed attempts. Try again in {secondsLeft} second
              {secondsLeft === 1 ? "" : "s"}.
            </span>
          </div>
        )}

        {!locked && formError && (
          <div
            role="alert"
            className="mt-6 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={handleChange("email")}
              onBlur={handleBlur("email")}
              disabled={locked || submitting}
              aria-invalid={touched.email && errors.email ? "true" : "false"}
              aria-describedby={touched.email && errors.email ? "login-email-error" : undefined}
              className={`mt-1 ${inputClass("email")}`}
              placeholder="jane@example.com"
            />
            {touched.email && errors.email && (
              <p id="login-email-error" className="mt-1 text-xs text-red-600">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative mt-1">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={values.password}
                onChange={handleChange("password")}
                onBlur={handleBlur("password")}
                disabled={locked || submitting}
                aria-invalid={touched.password && errors.password ? "true" : "false"}
                aria-describedby={
                  touched.password && errors.password ? "login-password-error" : undefined
                }
                className={`${inputClass("password")} pr-10`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {touched.password && errors.password && (
              <p id="login-password-error" className="mt-1 text-xs text-red-600">
                {errors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={locked || submitting}
            className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {locked ? `Try again in ${secondsLeft}s` : submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="font-medium text-slate-900 underline-offset-2 hover:underline"
          >
            Create one
          </button>
        </p>
      </div>

      {signedInAs && (
        <SuccessModal name={signedInAs.name} email={signedInAs.email} onClose={handleModalClose} />
      )}
    </div>
  );
}