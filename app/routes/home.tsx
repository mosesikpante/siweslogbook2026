import type { Route } from "./+types/home";
// @ts-ignore
import AuthPage from "../pages/lecturer/Authpage";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "SIWES Logbook App" },
    { name: "description", content: "Digital SIWES Logbook Platform" },
  ];
}

export default function Home() {
  // 2. Added ': any' to explicitly fix the TypeScript parameter type error
  return <AuthPage onLogin={(user: any) => console.log("Logged in user:", user)} />;
}