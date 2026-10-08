import { getCurrentUser } from "@/lib/supabase/server";
import { NavbarClient } from "./navbar-client";

export async function Navbar() {
  const user = await getCurrentUser();
  return (
    <NavbarClient
      user={
        user
          ? {
              name: user.profile?.full_name || user.email?.split("@")[0] || "User",
              email: user.email,
              isAdmin: user.profile?.role === "admin",
            }
          : null
      }
    />
  );
}
