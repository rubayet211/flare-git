"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Github, LogOut, User } from "lucide-react";

export function MainNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const isActive = (path) => pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Github className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">FlareGit</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/"
              className={`transition-colors hover:text-foreground/80 ${
                isActive("/") ? "text-foreground" : "text-foreground/60"
              }`}
            >
              Home
            </Link>
            {session && (
              <Link
                href="/dashboard"
                className={`transition-colors hover:text-foreground/80 ${
                  isActive("/dashboard")
                    ? "text-foreground"
                    : "text-foreground/60"
                }`}
              >
                Dashboard
              </Link>
            )}
          </nav>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />
          {status === "loading" ? (
            <Button variant="ghost" size="sm" disabled>
              Loading...
            </Button>
          ) : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User avatar"}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex h-10 w-10 items-center justify-center">
                    {session.user?.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || "User avatar"}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6" />
                    )}
                  </div>
                  <div className="flex flex-col space-y-1 leading-none">
                    {session.user?.name && (
                      <p className="font-medium">{session.user.name}</p>
                    )}
                    {session.user?.email && (
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {session.user.email}
                      </p>
                    )}
                    {session.user?.username && (
                      <p className="text-sm text-muted-foreground">
                        @{session.user.username}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={(event) => {
                    event.preventDefault();
                    signOut({
                      callbackUrl: `${window.location.origin}/auth/signin`,
                    });
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default" size="sm">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
