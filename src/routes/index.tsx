import { createFileRoute } from "@tanstack/react-router";
import { ModulesScreen } from "@/components/meteor/ModulesScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Meteor Web — Click GUI Modules" },
      {
        name: "description",
        content: "Web port of the Meteor Client modules click GUI: toggle modules, favorite them, search by title or setting, and tweak settings.",
      },
      { property: "og:title", content: "Meteor Web — Click GUI Modules" },
      { property: "og:description", content: "Browser recreation of Meteor Client's modules tab." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=VT323&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <ModulesScreen />;
}
