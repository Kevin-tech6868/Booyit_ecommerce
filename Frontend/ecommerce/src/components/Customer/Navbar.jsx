import { useState, useEffect } from "react";
import { Search, ShoppingCart, ChevronDown, User, LogOut, Package } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

// Must match SESSION_KEY in Login.jsx
const SESSION_KEY = "session";

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function Navbar() {
  const [session, setSession] = useState(() => readSession());
  const navigate = useNavigate();

  useEffect(() => {
    // Same-tab updates (fired by Login.jsx after a successful sign-in,
    // and by handleLogout below)
    function onSessionChange() {
      setSession(readSession());
    }
    // Cross-tab updates (e.g. signed out in another tab)
    function onStorage(e) {
      if (e.key === SESSION_KEY) setSession(readSession());
    }

    window.addEventListener("sessionchange", onSessionChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("sessionchange", onSessionChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new Event("sessionchange"));
    navigate("/createaccount");
  }

  return (
    <nav className="w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <div className="shrink-0">
            <h1 className="text-3xl font-black tracking-tight text-gray-900">
              Booyit
            </h1>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <Search
                size={20}
                strokeWidth={2}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                placeholder="Search for products, brands and more"
                className="
                  w-full
                  h-12
                  pl-12
                  pr-4
                  rounded-xl
                  border
                  border-gray-300
                  bg-gray-50
                  text-base
                  text-gray-900
                  placeholder:text-gray-400
                  outline-none
                  transition
                  focus:bg-white
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                "
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-8">

            {/* Account Dropdown */}
            <div className="relative group">

              {session ? (
                <>
                  {/* Signed-in button */}
                  <button
                    className="
                      flex
                      items-center
                      gap-2
                      text-base
                      font-semibold
                      text-gray-700
                      hover:text-blue-600
                      transition-colors
                    "
                  >
                    <User size={20} strokeWidth={2} />
                    {session.name.split(" ")[0]}

                    <ChevronDown
                      size={18}
                      strokeWidth={2}
                      className="transition-transform duration-200 group-hover:rotate-180"
                    />
                  </button>

                  {/* Dropdown */}
                  <div
                    className="
                      absolute
                      right-0
                      top-full
                      mt-2
                      w-52
                      rounded-xl
                      border
                      border-gray-200
                      bg-white
                      shadow-lg
                      opacity-0
                      invisible
                      translate-y-1
                      group-hover:opacity-100
                      group-hover:visible
                      group-hover:translate-y-0
                      transition-all
                      duration-200
                      z-50
                    "
                  >
                    <div className="py-2">
                      <div className="px-4 py-2 text-sm text-gray-400 truncate">
                        {session.email}
                      </div>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="
                          flex
                          w-full
                          items-center
                          gap-2.5
                          px-4
                          py-3
                          text-left
                          text-base
                          text-gray-700
                          hover:bg-gray-50
                          hover:text-blue-600
                          transition-colors
                        "
                      >
                        <LogOut size={18} strokeWidth={2} />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Login button */}
                  <button
                    className="
                      flex
                      items-center
                      gap-1.5
                      text-base
                      font-semibold
                      text-gray-700
                      hover:text-blue-600
                      transition-colors
                    "
                  >
                    Login

                    <ChevronDown
                      size={18}
                      strokeWidth={2}
                      className="transition-transform duration-200 group-hover:rotate-180"
                    />
                  </button>

                  {/* Dropdown */}
                  <div
                    className="
                      absolute
                      right-0
                      top-full
                      mt-2
                      w-52
                      rounded-xl
                      border
                      border-gray-200
                      bg-white
                      shadow-lg
                      opacity-0
                      invisible
                      translate-y-1
                      group-hover:opacity-100
                      group-hover:visible
                      group-hover:translate-y-0
                      transition-all
                      duration-200
                      z-50
                    "
                  >
                    <div className="py-2">

                      {/* Create Account */}
                      <Link
                        to="/createaccount"
                        className="
                          block
                          px-4
                          py-3
                          text-base
                          text-gray-700
                          hover:bg-gray-50
                          hover:text-blue-600
                          transition-colors
                        "
                      >
                        Create Account
                      </Link>

                      {/* Login */}
                      <Link
                        to="/login"
                        className="
                          block
                          px-4
                          py-3
                          text-base
                          text-gray-700
                          hover:bg-gray-50
                          hover:text-blue-600
                          transition-colors
                        "
                      >
                        Login
                      </Link>

                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Orders */}
            <Link
              to="/orders"
              className="
                flex
                items-center
                gap-2
                text-base
                font-semibold
                text-gray-700
                hover:text-blue-600
                transition-colors
              "
            >
              <Package size={20} strokeWidth={2} />
              Orders
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="
                flex
                items-center
                gap-1.5
                text-base
                font-semibold
                text-blue-600
                hover:text-yellow-600
                transition-colors
              "
            >
              <ShoppingCart size={24} strokeWidth={2} />
            </Link>

          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;