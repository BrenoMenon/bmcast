import { createFileRoute } from "@tanstack/react-router";
import { BmCastApp } from "@/bmcast/BmCastApp";

export const Route = createFileRoute("/tv/$slug")({
  head: () => ({
    meta: [
      { title: "BM Cast" },
      { name: "description", content: "Player de TV BM CAST para sinalização digital." },
      { property: "og:title", content: "BM Cast" },
      { property: "og:description", content: "Player de TV BM CAST para sinalização digital." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BmCastApp,
});
