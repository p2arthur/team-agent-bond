"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function TwinPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      router.push("/");
      return;
    }
    fetch(`/api/profile?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setProfile(data);
        else router.push("/");
      })
      .catch(() => router.push("/"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <LoadingSpinner message="Loading your twin..." />;
  if (!profile) return null;

  return (
    <main className="min-h-full px-5 py-8 md:px-8 xl:px-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-9 text-center">
          <span className="mono-label text-primary">Active identity</span>
          <h2 className="mt-3 font-display text-4xl font-black text-foreground">
            Your Digital Twin
          </h2>
          <p className="mt-2 text-muted-foreground">
            This is how the AI represents you when networking at events
          </p>
        </div>

        <div className="pressable-card dev-panel mb-8 overflow-hidden rounded-lg">
          <div className="h-1 bg-gradient-to-r from-primary via-amber-400 to-green-400" />
          <div className="p-7 md:p-9">
            <div className="mb-8 flex items-center gap-5">
              <div className="size-14 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                <span className="font-mono text-xl font-black text-accent">
                  {profile.user.name.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="font-display text-xl font-black text-foreground">
                  {profile.user.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {profile.profile.role}
                  {profile.profile.company && (
                    <span className="text-foreground/50">
                      {" "}
                      at {profile.profile.company}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="dev-panel-soft mb-7 rounded-lg p-6">
              <span className="mono-label mb-2 block text-primary">
                Twin Summary
              </span>
              <p className="text-sm text-foreground leading-relaxed">
                {profile.profile.twinSummary}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-7 md:grid-cols-2">
              <div>
                <span className="mono-label mb-2.5 block text-muted-foreground">
                  Skills
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.profile.skills.map((skill: string) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="rounded border border-accent/25 bg-accent/10 px-2.5 py-1 font-mono text-xs text-accent tag-hover"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="mono-label mb-2.5 block text-muted-foreground">
                  Interests
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.profile.interests.map((interest: string) => (
                    <Badge
                      key={interest}
                      variant="secondary"
                      className="rounded border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 font-mono text-xs text-amber-300 tag-hover"
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-9 flex flex-col gap-4">
          <DataPanel
            label="Networking Goal"
            value={profile.profile.networkingGoal}
          />
          <DataPanel label="Looking For" value={profile.profile.lookingFor} />
          <DataPanel label="Can Offer" value={profile.profile.canOffer} />
        </div>

        <Button
          onClick={() => router.push("/")}
          className="pressable-accent w-full h-12 font-mono text-sm font-black bg-accent text-primary-foreground hover:bg-primary/90 border-0 cursor-pointer"
        >
          Go to Board
        </Button>
      </div>
    </main>
  );
}

function DataPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="pressable dev-panel-soft rounded-lg p-6">
      <span className="mono-label mb-2 block text-muted-foreground">
        {label}
      </span>
      <p className="text-sm text-foreground leading-relaxed">{value}</p>
    </div>
  );
}
