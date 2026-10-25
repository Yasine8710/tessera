"use client";

import { Alert } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StaffError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-10">
      <Alert tone="danger" title="This page could not be loaded">
        Something went wrong while loading this page. No changes were lost. Try again, and contact an administrator if it keeps happening.
      </Alert>
      <Button className="mt-4" onClick={reset}>Try again</Button>
    </div>
  );
}
