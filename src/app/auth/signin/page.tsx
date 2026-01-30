"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate wisc.edu email
    if (!email.endsWith("@wisc.edu")) {
      setError("Please use your @wisc.edu email address");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: "/",
      });

      if (result?.error) {
        setError("Failed to send sign in link. Please try again.");
      } else {
        setEmailSent(true);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Check your email</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              We sent a sign-in link to <strong>{email}</strong>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Click the link in the email to sign in. The link will expire in 24
              hours.
            </p>
            <Button
              variant="ghost"
              className="mt-6"
              onClick={() => {
                setEmailSent(false);
                setEmail("");
              }}
            >
              Use a different email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-4 inline-flex items-center">
            <span className="text-2xl font-bold text-badger-red">Wisc</span>
            <span className="text-2xl font-bold text-accent-blue">Flow</span>
          </Link>
          <CardTitle>Sign in to WiscFlow</CardTitle>
          <p className="text-sm text-muted-foreground">
            Use your UW Madison email to sign in
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="netid@wisc.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              {error && (
                <p className="mt-1 text-sm text-destructive">{error}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending link...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send sign-in link
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              Only <strong>@wisc.edu</strong> email addresses are allowed.
            </p>
            <p className="mt-2">
              By signing in, you agree to our terms of service and that reviews
              should reflect genuine experiences.
            </p>
          </div>

          <div className="mt-6 border-t pt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
