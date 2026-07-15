import { useState } from "react";
import type { Route } from "./+types/home";
// @ts-expect-error SiwesApp is a JSX module without generated type declarations
import SiwesApp from "../SiwesApp.jsx";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "SIWES Logbook App" },
    { name: "description", content: "Digital SIWES Logbook Platform" },
  ];
}

export default function Home() {
  return <SiwesApp />;
}
