/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./index.ts",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        subway: {
          line1: "#0052A4",
          line2: "#00A84D",
          line3: "#EF7C1C",
          line4: "#00A5DE",
          line5: "#996CAC",
          line6: "#CD7C2F",
          line7: "#747F00",
          line8: "#E6186C",
          line9: "#BDB092",
          shinbundang: "#D4003B",
          suinbundang: "#F5A200",
          airport: "#0090D2",
          gyeongui: "#77C4A3",
        },
        congestion: {
          smooth: "#22C55E",
          normal: "#3B82F6",
          caution: "#F59E0B",
          congested: "#EF4444",
        },
      },
    },
  },
  plugins: [],
};
