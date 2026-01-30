import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="container flex min-h-[50vh] items-center justify-center py-8">
      <Card className="w-full max-w-md">
        <CardContent className="py-12 text-center">
          <h2 className="text-4xl font-bold text-muted-foreground">404</h2>
          <h3 className="mt-2 text-2xl font-bold">Page Not Found</h3>
          <p className="mt-2 text-muted-foreground">
            The page you're looking for doesn't exist.
          </p>
          <Link href="/">
            <Button className="mt-4">Go Home</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
