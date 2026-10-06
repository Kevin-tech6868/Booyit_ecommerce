import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

function BannerSlider({ slides, interval = 4000 }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  const goTo = (index) => setCurrent((index + count) % count);

  // Autoplay. The timer restarts whenever the slide changes, so clicking
  // an arrow or dot gives that slide a full interval before moving on.
  useEffect(() => {
    if (paused || count <= 1) return;
    const timer = setTimeout(() => {
      setCurrent((c) => (c + 1) % count);
    }, interval);
    return () => clearTimeout(timer);
  }, [current, paused, count, interval]);

  if (count === 0) return null;

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative overflow-hidden rounded-xl">
        {/* Track: all slides sit side by side and slide left/right */}
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {slides.map((slide, i) => {
            const image = (
              <img
                src={slide.src}
                alt={slide.alt}
                className="w-full h-full object-cover"
              />
            );
            const slideClass = "block min-w-full aspect-[533/257] bg-white";

            return slide.to ? (
              <Link
                key={i}
                to={slide.to}
                className={slideClass}
                aria-hidden={i !== current}
                tabIndex={i === current ? 0 : -1}
              >
                {image}
              </Link>
            ) : (
              <div key={i} className={slideClass} aria-hidden={i !== current}>
                {image}
              </div>
            );
          })}
        </div>

        {/* Arrows */}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(current - 1)}
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white shadow flex items-center justify-center text-gray-800 transition-colors"
            >
              <ChevronLeft size={22} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => goTo(current + 1)}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white shadow flex items-center justify-center text-gray-800 transition-colors"
            >
              <ChevronRight size={22} strokeWidth={2.5} />
            </button>
          </>
        )}
      </div>

      {/* Dots (below the image so they don't cover the banner text) */}
      {count > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-6 bg-purple-600"
                  : "w-2.5 bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default BannerSlider;