import { useTheme } from "./ThemeContext";
import ThemeSwitcher from "./ThemeSwitcher";

export function Header() {
  const { theme } = useTheme();

  return (
    <header
      className={`${theme === "light" ? "bg-amber-100 text-slate-700" : "bg-slate-900 text-white"} p-4 sm:p-7 sticky top-0 z-10 shadow-lg w-full flex items-center justify-center`}
    >
      <div className="flex flex-col">
        <h1 className="text-4xl sm:text-7xl text-center font-thin">PokeBattle</h1>
        <ThemeSwitcher />
      </div>
    </header>
  );
}
