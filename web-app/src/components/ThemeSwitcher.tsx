import { IoIosMoon, IoIosSunny } from "react-icons/io";
import { useTheme } from "./ThemeContext";

export default function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === "light" ? "dark" : "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} mode`}
      className="max-w-fit flex items-center gap-1 self-center"
    >
      {theme === "light" ? <IoIosMoon /> : <IoIosSunny />}
      <span>{nextTheme} mode</span>
    </button>
  );
}
