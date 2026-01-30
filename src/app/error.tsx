"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="container flex min-h-[50vh] items-center justify-center py-8">
      <Card className="w-full max-w-md">
        <CardContent className="py-12 text-center">
          <h2 className="text-2xl font-bold">Something went wrong!</h2>
          <p className="mt-2 text-muted-foreground">
            An unexpected error occurred. Please try again.
          </p>
          <Button onClick={reset} className="mt-4">
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
