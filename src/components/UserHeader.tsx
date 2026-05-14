"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Zap } from "lucide-react";

export function UserHeader() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const name = localStorage.getItem("userName") || "User";
    setUserName(name);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwitchUser = () => {
    setDropdownOpen(false);
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("agent-bond-kanban");
    router.push("/profile");
  };

  return (
    <div className="mb-6 flex items-center justify-between">
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-3 cursor-pointer"
      >
        <Zap className="size-5 text-primary" />
        <span className="font-display text-lg font-black text-foreground">
          Agent Bond
        </span>
      </button>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 rounded-lg border border-border bg-card/80 px-3 py-2 transition-colors hover:bg-muted cursor-pointer"
        >
          <div className="size-7 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center">
            <span className="font-mono font-black text-accent text-[10px]">
              {userName.charAt(0)}
            </span>
          </div>
          <span className="font-mono text-sm font-bold text-foreground">
            {userName}
          </span>
          <ChevronDown
            className={`size-3.5 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
          />
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-52 rounded-lg border border-border bg-card shadow-lg overflow-hidden z-50 animate-fade-in">
            <div className="px-3 py-2.5 border-b border-border">
              <p className="font-mono text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Current Twin
              </p>
              <p className="font-mono text-sm font-bold text-foreground mt-0.5">
                {userName}
              </p>
            </div>
            <button
              onClick={handleSwitchUser}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <LogOut className="size-3.5" />
              <span className="font-mono text-xs font-bold">
                Create New Twin
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
