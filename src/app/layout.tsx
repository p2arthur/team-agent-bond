import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Bot,
  CalendarDays,
  Home,
  Network,
  Radar,
  Sparkles,
  UserRound,
} from "lucide-react";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-app",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Agent Bond — AI Networking Twin",
  description: "Your AI-powered networking agent for events.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          spaceGrotesk.variable,
          jetbrainsMono.variable,
          "font-sans",
        )}
      >
        <div className="h-screen overflow-hidden bg-background text-foreground">
          <div className="flex h-full">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <Header />
              <main className="app-grid min-h-0 flex-1 overflow-y-auto bg-background">
                {children}
              </main>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="z-40 h-16 shrink-0 border-b border-border bg-card/85 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-5 md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="flex items-center gap-2 md:hidden">
            <BrandMark />
            <span className="font-display text-base font-black text-foreground">
              Agent Bond
            </span>
          </Link>
          <div className="hidden items-center gap-2 md:flex">
            <span className="mono-label text-muted-foreground">Workspace</span>
            <span className="h-4 w-px bg-border" />
            <span className="text-sm font-bold text-foreground">
              Networking Twin Ops
            </span>
          </div>
        </div>
        <nav className="hidden items-center gap-1 sm:flex md:hidden">
          <NavLink href="/" icon={<Home className="size-4" />}>
            Board
          </NavLink>
          <NavLink href="/twin" icon={<Bot className="size-4" />}>
            Twin
          </NavLink>
        </nav>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-md border border-border bg-muted px-2.5 py-1 font-mono text-xs font-bold text-muted-foreground sm:inline-flex">
            LIVE DEMO
          </span>
          <Link
            href="/profile"
            className="pressable-accent inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 font-mono text-xs font-black text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Sparkles className="size-4" />
            Create Twin
          </Link>
        </div>
      </div>
    </header>
  );
}

function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar md:flex md:flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <BrandMark />
        <span className="font-display text-lg font-black text-sidebar-foreground">
          Agent Bond
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-1.5 px-4 py-5">
        <NavLink href="/" icon={<Home className="size-4" />}>
          Board
        </NavLink>
        <NavLink href="/profile" icon={<UserRound className="size-4" />}>
          Profile
        </NavLink>
        <NavLink href="/twin" icon={<Bot className="size-4" />}>
          My Twin
        </NavLink>
        <NavLink href="/matches" icon={<Network className="size-4" />}>
          Matches
        </NavLink>
        <NavLink href="/schedule" icon={<CalendarDays className="size-4" />}>
          Event Schedule
        </NavLink>
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <Link
          href="/profile"
          className="pressable-accent mb-4 flex h-11 items-center justify-center gap-2 rounded-md bg-primary font-mono text-xs font-black text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Sparkles className="size-4" />
          Create New Twin
        </Link>
        <div className="dev-panel-soft rounded-lg p-4">
          <div className="mb-3 flex items-center gap-2 text-primary">
            <Radar className="size-4" />
            <span className="mono-label">Scan Engine</span>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Twins run lightweight conversations before recommending a meeting.
          </p>
        </div>
        <div className="mt-4 flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <CalendarDays className="size-4" />
          Calendar links ready
        </div>
      </div>
    </aside>
  );
}

function BrandMark() {
  return (
    <div className="grid size-8 place-items-center rounded-md border border-primary/40 bg-primary/15 shadow-[0_0_22px_rgba(225,104,78,0.16)]">
      <span className="font-mono text-sm font-black text-primary">AB</span>
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-bold text-muted-foreground",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
