import { createFileRoute } from "@tanstack/react-router";
import { BmCastApp } from "@/bmcast/BmCastApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BM Cast" },
      {
        name: "description",
        content:
          "Transforme qualquer TV em uma tela de mídia indoor: cardápios, promoções, clima ao vivo e QR Codes, controlados pelo celular.",
      },
      { property: "og:title", content: "BM Cast" },
      {
        property: "og:description",
        content: "Controle as TVs da sua empresa pelo celular: cardápios, promoções, clima e QR Codes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BmCastApp,
});
