function Foot() {
  return (
    <footer className="bg-gray-950 text-gray-400 border-t border-gray-800">
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Top Section */}
        <div className="flex flex-col md:flex-row justify-between gap-8">

          {/* Brand */}
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Booyit
            </h2>

            <p className="mt-2 text-sm text-gray-500 max-w-xs">
              Everything you need, all in one place.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-12">

            <div>
              <h3 className="text-sm font-semibold text-white mb-3">
                Shop
              </h3>

              <div className="flex flex-col gap-2 text-sm">
                <a href="/fashion" className="hover:text-white transition">
                  Fashion
                </a>

                <a href="/mobiles" className="hover:text-white transition">
                  Mobiles
                </a>

                <a href="/electronics" className="hover:text-white transition">
                  Electronics
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-3">
                Help
              </h3>

              <div className="flex flex-col gap-2 text-sm">
                <a href="/login" className="hover:text-white transition">
                  Login
                </a>

                <a href="/cart" className="hover:text-white transition">
                  Cart
                </a>

                <a href="/contact" className="hover:text-white transition">
                  Contact
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-6 border-t border-gray-800 flex flex-col md:flex-row justify-between gap-3 text-xs text-gray-500">
          <p>
            © 2026 Booyit. All rights reserved.
          </p>

          <p>
            Shop smarter. Live better.
          </p>
        </div>

      </div>
    </footer>
  );
}

export default Foot;