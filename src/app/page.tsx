import { redirect } from "next/navigation";

export default function Home() {
  // Gerbang utama: dashboard (W-FR-1.2). Middleware auth menyusul.
  redirect("/dashboard");
}
