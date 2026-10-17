import { redirect } from "next/navigation";

export default async function SignInAliasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") q.set(key === "appRole" ? "role" : key, value);
  }
  if (!q.has("role") && typeof params.appRole === "string") q.set("role", params.appRole);
  const query = q.toString();
  redirect(query ? `/login?${query}` : "/login");
}
