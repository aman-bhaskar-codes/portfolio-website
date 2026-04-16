"use client";
import { useSession } from "next-auth/react";

export default function useUserRole() {
    const { data: session, status } = useSession();

    if (status === "loading") return "loading";

    // Cast to explicit types since our next-auth.d.ts might not be perfectly aligned
    const role = (session?.user as any)?.role || "public";

    return role;
}
