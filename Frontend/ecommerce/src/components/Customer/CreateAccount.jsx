import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Check, X, AlertCircle } from "lucide-react";

// Password rules — tweak freely to match your product's requirements
const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { id: "upper", label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { id: "lower", label: "One lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { id: "number", label: "One number", test: (pw) => /[0-9]/.test(pw) },
  { id: "special", label: "One special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

const NAME_REGEX = /^[A-Za-z][A-Za-z\s'-]{1,49}$/;
const EMAIL_REGEX =
  /^(?!.*\.\.)[A-Za-z0-9](?:[A-Za-z0-9._%+-]*[A-Za-z0-9])?@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;

// Where the backend is listening (see Backend/server.js)
const API_URL = "http://localhost:4000";

function validateName(name) {
  if (!name.trim()) return "Name is required.";
  if (!NAME_REGEX.test(name.trim())) {
    return "Name must be 2–50 letters, and may include spaces, hyphens or apostrophes.";
  }
  return "";
}

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

function validatePassword(password) {
  if (!password) return "Password is required.";
  const failed = PASSWORD_RULES.filter((rule) => !rule.test(password));
  if (failed.length > 0) return "Password doesn't meet all requirements yet.";
  return "";
}

function validateConfirm(password, confirm) {
  if (!confirm) return "Please confirm your password.";
  if (password !== confirm) return "Passwords don't match.";
  return "";
}

/**
 * Sends the new account to the backend, which writes it to
 * src/data/accounts.json (see Backend/server.js).
 * Throws an Error with a user-facing message on failure.
 */
async function saveAccount(account) {
  const record = { ...account };
  delete record.confirm;

  let res;
  try {
    res = await fetch(`${API_URL}/api/accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
  } catch {
    throw new Error("Couldn't reach the server. Is the backend running?");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Something went wrong. Please try again.");
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
      aria-labelledby="success-title"
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
        <h2 id="success-title" className="text-center text-lg font-semibold text-slate-900">
          Account created successfully
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Welcome, {name.split(" ")[0]}. {email} is ready to sign in.
        </p>

        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Done
        </button>
      </div>
    </div>
  );
}

export default function CreateAccount() {
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const errors = {
    name: validateName(values.name),
    email: validateEmail(values.email),
    password: validatePassword(values.password),
    confirm: validateConfirm(values.password, values.confirm),
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
    setTouched({ name: true, email: true, password: true, confirm: true });
    if (!isValid || submitting) return;

    setSubmitting(true);
    setFormError("");
    try {
      await saveAccount({ ...values, createdAt: new Date().toISOString() });
      setShowSuccess(true);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleModalClose() {
    setShowSuccess(false);
    setValues({ name: "", email: "", password: "", confirm: "" });
    setTouched({});
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-xl font-semibold text-slate-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">
          It only takes a minute.
        </p>

        {formError && (
          <div
            role="alert"
            className="mt-6 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={values.name}
              onChange={handleChange("name")}
              onBlur={handleBlur("name")}
              disabled={submitting}
              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none transition focus:ring-2 disabled:bg-slate-50 ${
                touched.name && errors.name
                  ? "border-red-300 focus:ring-red-200"
                  : "border-slate-300 focus:ring-slate-200"
              }`}
              placeholder="Jane Doe"
            />
            {touched.name && errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={handleChange("email")}
              onBlur={handleBlur("email")}
              disabled={submitting}
              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none transition focus:ring-2 disabled:bg-slate-50 ${
                touched.email && errors.email
                  ? "border-red-300 focus:ring-red-200"
                  : "border-slate-300 focus:ring-slate-200"
              }`}
              placeholder="jane@example.com"
            />
            {touched.email && errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={values.password}
                onChange={handleChange("password")}
                onBlur={handleBlur("password")}
                disabled={submitting}
                className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm text-slate-900 outline-none transition focus:ring-2 disabled:bg-slate-50 ${
                  touched.password && errors.password
                    ? "border-red-300 focus:ring-red-200"
                    : "border-slate-300 focus:ring-slate-200"
                }`}
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

            {/* Live rule checklist */}
            {(touched.password || values.password) && (
              <ul className="mt-2 space-y-1">
                {PASSWORD_RULES.map((rule) => {
                  const pass = rule.test(values.password);
                  return (
                    <li key={rule.id} className="flex items-center gap-1.5 text-xs">
                      {pass ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-slate-300" />
                      )}
                      <span className={pass ? "text-slate-500" : "text-slate-400"}>
                        {rule.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-slate-700">
              Confirm password
            </label>
            <div className="relative mt-1">
              <input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                value={values.confirm}
                onChange={handleChange("confirm")}
                onBlur={handleBlur("confirm")}
                disabled={submitting}
                className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm text-slate-900 outline-none transition focus:ring-2 disabled:bg-slate-50 ${
                  touched.confirm && errors.confirm
                    ? "border-red-300 focus:ring-red-200"
                    : "border-slate-300 focus:ring-slate-200"
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {touched.confirm && errors.confirm && (
              <p className="mt-1 text-xs text-red-600">{errors.confirm}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-slate-900 underline-offset-2 hover:underline"
          >
            Sign in
          </Link>
        </p>

        <p className="mt-2 text-center text-sm text-slate-500">
          <Link
            to="/"
            className="font-medium text-slate-900 underline-offset-2 hover:underline"
          >
            Continue as guest
          </Link>
        </p>
      </div>

      {showSuccess && (
        <SuccessModal name={values.name} email={values.email} onClose={handleModalClose} />
      )}
    </div>
  );
}