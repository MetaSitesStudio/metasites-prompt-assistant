module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { fuchsia: "#a855f7", indigo: "#6366f1" }
      },
      boxShadow: { glow: "0 10px 30px rgba(168,85,247,.25)" }
    }
  },
  plugins: []
}
