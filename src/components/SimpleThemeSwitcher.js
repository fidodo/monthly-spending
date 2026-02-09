import React, { useState, useEffect } from "react";

const SimpleThemeSwitcher = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for saved theme
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setIsDark(true);
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.add("light-theme");
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);

    if (newIsDark) {
      document.body.classList.remove("light-theme");
      document.body.classList.add("dark-theme");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-theme");
      document.body.classList.add("light-theme");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: isDark ? "#333" : "#fff",
        color: isDark ? "#fff" : "#333",
        border: `1px solid ${isDark ? "#666" : "#ddd"}`,
        padding: "10px 20px",
        borderRadius: "20px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontWeight: "bold",
      }}
    >
      {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
    </button>
  );
};

export default SimpleThemeSwitcher;
