import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAdminMe, useAdminLogout } from "@workspace/api-client-react";

export function useAdminAuth() {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading, isError } = useAdminMe({
    query: {
      retry: false,
      queryKey: ["adminMe"],
    }
  });

  useEffect(() => {
    if (!isLoading && (isError || !user)) {
      if (!location.startsWith("/admin/login")) {
        setLocation("/admin/login");
      }
    }
  }, [user, isLoading, isError, location, setLocation]);

  return { user, isLoading };
}
