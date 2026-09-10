"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// A first-time-only tour for real (Supabase-authenticated) users. Gated on
// `users.onboarded_at` (docs/onboarding-tour.sql) rather than localStorage so
// it stays correct across devices and survives clearing browser storage.
export function useOnboardingTour() {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function checkTourStatus(userId: string | undefined) {
      if (!userId) {
        if (!cancelled) setShouldShow(false);
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("onboarded_at")
        .eq("auth_user_id", userId)
        .maybeSingle();

      if (!cancelled) setShouldShow(data ? data.onboarded_at === null : false);
    }

    supabase.auth.getSession().then(({ data }) => {
      checkTourStatus(data.session?.user.id);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      checkTourStatus(session?.user.id);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const completeTour = async () => {
    setShouldShow(false);
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) return;
    await supabase
      .from("users")
      .update({ onboarded_at: new Date().toISOString() })
      .eq("auth_user_id", userId);
  };

  return { shouldShow, completeTour };
}
