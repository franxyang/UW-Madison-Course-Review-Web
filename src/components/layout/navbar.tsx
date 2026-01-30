"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Search, User, LogOut } from "lucide-react";

export function Navbar() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-badger-red">Wisc</span>
          <span className="text-2xl font-bold text-accent-blue">Flow</span>
        </Link>

        {/* Navigation */}
        <nav className="mx-6 flex items-center space-x-4 lg:space-x-6">
          <Link
            href="/courses"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Courses
          </Link>
          {session && (
            <Link
              href="/profile/reviews"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              My Reviews
            </Link>
          )}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search (links to courses page) */}
        <Link href="/courses" className="mr-4">
          <Button variant="outline" size="sm" className="w-[200px] justify-start">
            <Search className="mr-2 h-4 w-4" />
            <span className="text-muted-foreground">Search courses...</span>
          </Button>
        </Link>

        {/* Auth */}
        {status === "loading" ? (
          <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
        ) : session ? (
          <div className="flex items-center gap-2">
            <Link href="/profile">
              <Button variant="ghost" size="sm">
                <User className="mr-2 h-4 w-4" />
                {session.user?.name || session.user?.email?.split("@")[0]}
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut()}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button onClick={() => signIn()} size="sm">
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
}
