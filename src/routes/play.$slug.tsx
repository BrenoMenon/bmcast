import { createFileRoute } from "@tanstack/react-router";
import { BmCastApp } from "@/bmcast/BmCastApp";

export const Route = createFileRoute("/play/$slug")({
  head: () => ({
    meta: [
      { title: "BM Cast" },
      { name: "description", content: "Exibição ao vivo de mídia indoor BM CAST." },
      { property: "og:title", content: "BM Cast" },
      { property: "og:description", content: "Exibição ao vivo de mídia indoor BM CAST." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BmCastApp,
});
