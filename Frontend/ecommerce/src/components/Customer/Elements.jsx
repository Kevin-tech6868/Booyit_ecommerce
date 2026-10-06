import {
  Sparkles,
  Shirt,
  Smartphone,
  Laptop,
  Heart,
  Home,
  Gamepad2,
  Dumbbell,
  Armchair,
  ChevronRight,
} from "lucide-react";

// Your navbar is h-14 (56px) + 1px border
const NAVBAR_HEIGHT = "57px";

const categories = [
  {
    name: "For You",
    icon: Sparkles,
    path: "/",
    text: "text-purple-600",
    soft: "bg-purple-50",
    solid: "bg-purple-600",
    hoverSolid: "group-hover:bg-purple-600",
    rowHover: "hover:bg-purple-50",
    bar: "bg-purple-600",
  },
  {
    name: "Fashion",
    icon: Shirt,
    path: "/fashion",
    text: "text-pink-600",
    soft: "bg-pink-50",
    solid: "bg-pink-600",
    hoverSolid: "group-hover:bg-pink-600",
    rowHover: "hover:bg-pink-50",
    bar: "bg-pink-600",
  },
  {
    name: "Mobiles",
    icon: Smartphone,
    path: "/mobiles",
    text: "text-blue-600",
    soft: "bg-blue-50",
    solid: "bg-blue-600",
    hoverSolid: "group-hover:bg-blue-600",
    rowHover: "hover:bg-blue-50",
    bar: "bg-blue-600",
  },
  {
    name: "Electronics",
    icon: Laptop,
    path: "/electronics",
    text: "text-cyan-600",
    soft: "bg-cyan-50",
    solid: "bg-cyan-600",
    hoverSolid: "group-hover:bg-cyan-600",
    rowHover: "hover:bg-cyan-50",
    bar: "bg-cyan-600",
  },
  {
    name: "Beauty",
    icon: Heart,
    path: "/beauty",
    text: "text-rose-600",
    soft: "bg-rose-50",
    solid: "bg-rose-600",
    hoverSolid: "group-hover:bg-rose-600",
    rowHover: "hover:bg-rose-50",
    bar: "bg-rose-600",
  },
  {
    name: "Decor",
    icon: Home,
    path: "/decor",
    text: "text-amber-600",
    soft: "bg-amber-50",
    solid: "bg-amber-500",
    hoverSolid: "group-hover:bg-amber-500",
    rowHover: "hover:bg-amber-50",
    bar: "bg-amber-500",
  },
  {
    name: "Toys",
    icon: Gamepad2,
    path: "/toys",
    text: "text-green-600",
    soft: "bg-green-50",
    solid: "bg-green-600",
    hoverSolid: "group-hover:bg-green-600",
    rowHover: "hover:bg-green-50",
    bar: "bg-green-600",
  },
  {
    name: "Sports",
    icon: Dumbbell,
    path: "/sports",
    text: "text-orange-600",
    soft: "bg-orange-50",
    solid: "bg-orange-600",
    hoverSolid: "group-hover:bg-orange-600",
    rowHover: "hover:bg-orange-50",
    bar: "bg-orange-600",
  },
  {
    name: "Furniture",
    icon: Armchair,
    path: "/furniture",
    text: "text-indigo-600",
    soft: "bg-indigo-50",
    solid: "bg-indigo-600",
    hoverSolid: "group-hover:bg-indigo-600",
    rowHover: "hover:bg-indigo-50",
    bar: "bg-indigo-600",
  },
];

function Elements() {
  const currentPath = window.location.pathname;

  return (
    <aside
      className="sticky shrink-0 w-72 bg-white border-r border-gray-200 p-3 overflow-y-auto"
      style={{
        top: NAVBAR_HEIGHT,
        height: `calc(100vh - ${NAVBAR_HEIGHT})`,
      }}
    >
      <ul className="flex flex-col gap-2 h-full">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = currentPath === category.path;

          return (
            <li key={category.name} className="flex-1 min-h-[68px]">
              <a
                href={category.path}
                className={`
                  group
                  relative
                  flex
                  items-center
                  gap-4
                  h-full
                  px-5
                  rounded-2xl
                  overflow-hidden
                  transition-all
                  duration-200
                  ${isActive ? category.soft : category.rowHover}
                `}
              >
                {/* Accent bar: always visible when active, slides in on hover */}
                <span
                  className={`
                    absolute
                    left-0
                    top-1/2
                    -translate-y-1/2
                    w-1.5
                    rounded-r-full
                    transition-all
                    duration-200
                    ${category.bar}
                    ${isActive ? "h-10" : "h-0 group-hover:h-10"}
                  `}
                />

                {/* Icon: fills with its color and tilts on hover */}
                <div
                  className={`
                    w-12
                    h-12
                    rounded-2xl
                    flex
                    items-center
                    justify-center
                    shrink-0
                    transition-all
                    duration-200
                    group-hover:scale-110
                    group-hover:rotate-3
                    group-hover:text-white
                    ${category.hoverSolid}
                    ${
                      isActive
                        ? `${category.solid} text-white`
                        : `${category.soft} ${category.text}`
                    }
                  `}
                >
                  <Icon size={24} strokeWidth={2.25} />
                </div>

                {/* Label */}
                <span
                  className={`
                    text-lg
                    font-bold
                    tracking-tight
                    transition-transform
                    duration-200
                    group-hover:translate-x-0.5
                    ${isActive ? category.text : "text-gray-800"}
                  `}
                >
                  {category.name}
                </span>

                {/* Arrow */}
                <ChevronRight
                  size={20}
                  strokeWidth={2.5}
                  className="
                    ml-auto
                    text-gray-400
                    opacity-0
                    -translate-x-2
                    transition-all
                    duration-200
                    group-hover:opacity-100
                    group-hover:translate-x-0
                  "
                />
              </a>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

export default Elements;