export default function manifest() {
  return {
    name: "Grocery Store POS and E-Commerce",
    short_name: "Grocery Store",
    description: "Shared PWA for customer shopping, cashier POS, and store operations.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f2ec",
    theme_color: "#127c73",
    orientation: "portrait-primary",
    categories: ["shopping", "business", "productivity"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
    ],
  };
}
