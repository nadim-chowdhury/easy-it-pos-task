"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import LoadingPage from "@/app/loading";

interface Props {
  children: React.ReactNode;
}

interface TokenPayload {
  exp: number;
  [key: string]: any;
}

export default function ProtectedRoute({ children }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const localData = localStorage.getItem("POSuser");
    const parsedData = localData ? JSON.parse(localData) : null;
    const token = parsedData?.data?.token;

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const decoded: TokenPayload = jwtDecode(token);

      // Check token expiry
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        router.push("/login");
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Invalid token:", err);
      localStorage.removeItem("token");
      router.push("/login");
    }
  }, [router]);

  if (loading) {
    return <LoadingPage />;
  }

  return <>{children}</>;
}
