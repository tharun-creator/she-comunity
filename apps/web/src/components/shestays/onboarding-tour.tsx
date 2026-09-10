"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useOnboardingTour } from "@/hooks/use-onboarding-tour";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    title: "Welcome to SheStays",
    description:
      "A community by and for women living in PGs — search a PG, join its community, and read honest reviews from women who've actually stayed there.",
  },
  {
    title: "Find your PG's community",
    description:
      "Every PG has its own community feed. Join the ones you live in or are considering to see reviews, discussions, and polls from residents.",
  },
  {
    title: "Share safely, anonymously if you want",
    description:
      'Post a review or start a discussion any time. Toggle "Post anonymously" and your identity is never shown to other members on that post.',
  },
  {
    title: "Stay in the loop",
    description:
      "Replies, upvotes, and mentions show up under Notifications. Manage your profile and saved posts from the top nav whenever you like.",
  },
];

export function OnboardingTour() {
  const { shouldShow, completeTour } = useOnboardingTour();
  const [step, setStep] = useState(0);

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const handleOpenChange = (open: boolean) => {
    if (!open) completeTour();
  };

  return (
    <Dialog open={shouldShow} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-1 flex gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-muted")}
              />
            ))}
          </div>
          <DialogTitle>{current.title}</DialogTitle>
          <DialogDescription>{current.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={completeTour}>
            Skip
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            )}
            <Button onClick={() => (isLast ? completeTour() : setStep((s) => s + 1))}>
              {isLast ? "Get started" : "Next"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
