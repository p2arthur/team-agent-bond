"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { CheckCircle2, Link2, Loader2 } from "lucide-react";

interface ProfileData {
  role: string;
  company: string;
  industry: string;
  skills: string[];
  interests: string[];
  networkingGoal: string;
  lookingFor: string;
  canOffer: string;
  preferredTopics: string[];
}

const MOCK_LINKEDIN_PROFILE = `Head of Product at NovaTech | Ex-Meta, Stripe | Building AI-powered developer tools

10+ years in product management and engineering leadership. Currently leading product strategy at NovaTech, where we're building the next generation of AI-assisted development workflows.

Previously led product teams at Meta (Workplace) and Stripe (Developer Platform), shipping tools used by millions of developers worldwide.

Passionate about the intersection of AI and developer experience. I believe the future of software development is collaborative — humans and AI working together to build better products, faster.

Looking to connect with:
- AI/ML founders building developer tools
- Product leaders navigating the AI transition
- Investors focused on developer infrastructure
- Fellow builders who care about developer experience

Specialties: Product Strategy, Developer Experience, AI/ML Products, Platform Engineering, Team Leadership, Go-to-Market`;

export default function ProfilePage() {
  const router = useRouter();
  const [mode, setMode] = useState<"loading" | "view" | "create" | "edit">(
    "loading",
  );
  const [name, setName] = useState("");
  const [linkedInText, setLinkedInText] = useState("");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [linkedInConnected, setLinkedInConnected] = useState(false);
  const [linkedInLoading, setLinkedInLoading] = useState(false);

  const handleLinkedInConnect = async () => {
    setLinkedInLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1800));
    setLinkedInText(MOCK_LINKEDIN_PROFILE);
    setLinkedInConnected(true);
    setLinkedInLoading(false);
  };

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setMode("create");
      return;
    }
    fetch(`/api/profile?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setExistingProfile(data);
          setMode("view");
        } else {
          setMode("create");
        }
      })
      .catch(() => setMode("create"));
  }, []);

  const handleExtract = async () => {
    if (!linkedInText.trim()) {
      setError("Please paste your bio or profile content");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/profile/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedInText }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setProfile(data.profile);
      setMode("edit");
    } catch (err: any) {
      setError(err.message || "Failed to extract");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !profile) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          ...profile,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("userName", data.user.name);
      router.push("/twin");
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof ProfileData, value: any) => {
    if (profile) setProfile({ ...profile, [field]: value });
  };

  if (mode === "loading")
    return <LoadingSpinner message="Loading profile..." />;

  if (mode === "view" && existingProfile) {
    return (
      <main className="min-h-full px-5 py-8 md:px-8 xl:px-10">
        <div className="mx-auto max-w-4xl">
          <div className="dev-panel overflow-hidden rounded-lg">
            <div className="h-1 bg-gradient-to-r from-primary via-amber-400 to-green-400" />
            <div className="p-7 md:p-9">
              <div className="mb-9">
                <span className="mono-label text-primary">Identity packet</span>
                <h2 className="mt-3 font-display text-3xl font-black text-foreground">
                  {existingProfile.user.name}
                </h2>
                <p className="mt-2 text-muted-foreground">
                  {existingProfile.profile.role}
                  {existingProfile.profile.company &&
                    ` at ${existingProfile.profile.company}`}
                </p>
              </div>

              <div className="dev-panel-soft mb-7 rounded-lg p-6">
                <span className="mono-label mb-2 block text-primary">
                  Twin Summary
                </span>
                <p className="text-sm text-foreground leading-relaxed">
                  {existingProfile.profile.twinSummary}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-6">
                <div>
                  <span className="mono-label mb-2.5 block text-muted-foreground">
                    Industry
                  </span>
                  <p className="text-sm text-foreground">
                    {existingProfile.profile.industry || "Not specified"}
                  </p>
                </div>
                <div>
                  <span className="mono-label mb-2.5 block text-muted-foreground">
                    Company
                  </span>
                  <p className="text-sm text-foreground">
                    {existingProfile.profile.company || "Not specified"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-6">
                <div>
                  <span className="mono-label mb-2.5 block text-muted-foreground">
                    Skills
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {existingProfile.profile.skills.map((skill: string) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="rounded border border-accent/25 bg-accent/10 px-2.5 py-1 font-mono text-xs text-accent"
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
                    {existingProfile.profile.interests.map(
                      (interest: string) => (
                        <Badge
                          key={interest}
                          variant="secondary"
                          className="rounded border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 font-mono text-xs text-amber-300"
                        >
                          {interest}
                        </Badge>
                      ),
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 mb-9">
                <DataPanel
                  label="Networking Goal"
                  value={existingProfile.profile.networkingGoal}
                />
                <DataPanel
                  label="Looking For"
                  value={existingProfile.profile.lookingFor}
                />
                <DataPanel
                  label="Can Offer"
                  value={existingProfile.profile.canOffer}
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={() => router.push("/")}
                  variant="secondary"
                  className="pressable flex-1 h-12 text-sm bg-muted border border-border cursor-pointer"
                >
                  Back to Board
                </Button>
                <Button
                  onClick={() => router.push("/twin")}
                  className="pressable-accent flex-1 h-12 font-mono text-sm font-black bg-accent text-primary-foreground hover:bg-primary/90 border-0 cursor-pointer"
                >
                  View Twin
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (mode === "create") {
    return (
      <main className="min-h-full px-5 py-8 md:px-8 xl:px-10">
        <div className="mx-auto max-w-4xl">
          <div className="dev-panel rounded-lg p-7 md:p-9">
            <div className="mb-9">
              <span className="mono-label text-primary">Identity packet</span>
              <h2 className="mt-3 font-display text-3xl font-black text-foreground">
                Create Your Profile
              </h2>
              <p className="mt-2 text-muted-foreground">
                Tell us about yourself so your AI twin can network at events
                for you — finding the right people and breaking the ice.
              </p>
            </div>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1.5">
                <Label className="mono-label text-muted-foreground">
                  Your Name *
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="h-12 bg-muted border-border font-mono text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="mono-label text-muted-foreground">
                  Data Source
                </Label>
                {!linkedInConnected ? (
                  <button
                    onClick={handleLinkedInConnect}
                    disabled={linkedInLoading}
                    className="flex items-center gap-3 rounded-lg border border-[#0A66C2]/30 bg-[#0A66C2]/5 px-4 py-3 text-left transition-all hover:bg-[#0A66C2]/10 hover:border-[#0A66C2]/50 cursor-pointer disabled:opacity-60"
                  >
                    {linkedInLoading ? (
                      <Loader2 className="size-5 text-[#0A66C2] animate-spin" />
                    ) : (
                      <svg className="size-5 shrink-0" viewBox="0 0 24 24" fill="#0A66C2">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-bold text-[#0A66C2]">
                        {linkedInLoading ? "Connecting to LinkedIn..." : "Connect LinkedIn"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Auto-import your professional profile
                      </p>
                    </div>
                    <Link2 className="size-4 text-[#0A66C2]/50" />
                  </button>
                ) : (
                  <div className="flex items-center gap-3 rounded-lg border border-green-400/30 bg-green-400/5 px-4 py-3">
                    <CheckCircle2 className="size-5 text-green-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-bold text-green-300">
                        LinkedIn Connected
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Profile imported — review below or edit as needed
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="mono-label text-muted-foreground">
                  Your Bio or Professional Summary *
                </Label>
                <Textarea
                  value={linkedInText}
                  onChange={(e) => {
                    setLinkedInText(e.target.value);
                    if (linkedInConnected) setLinkedInConnected(false);
                  }}
                  placeholder="Paste your LinkedIn summary, professional bio, or describe your background..."
                  className="min-h-[180px] bg-muted border-border text-sm resize-y"
                />
              </div>
              {error && (
                <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                  <p className="text-destructive text-sm">{error}</p>
                </div>
              )}
              <Button
                onClick={handleExtract}
                disabled={loading || !name.trim() || !linkedInText.trim()}
                className="pressable-accent w-full h-12 font-mono text-sm font-black bg-accent text-primary-foreground hover:bg-primary/90 border-0 cursor-pointer disabled:opacity-30"
              >
                {loading ? "Extracting..." : "Extract Profile with AI"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full px-5 py-8 md:px-8 xl:px-10">
      <div className="mx-auto max-w-4xl">
        <div className="dev-panel rounded-lg p-7 md:p-9">
          <div className="mb-9">
            <span className="mono-label text-primary">Review packet</span>
            <h2 className="mt-3 font-display text-3xl font-black text-foreground">
              Review Your Profile
            </h2>
            <p className="mt-2 text-muted-foreground">
              AI extracted these details. Edit anything that doesn&apos;t look
              right.
            </p>
          </div>
          {profile && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <Label className="mono-label text-muted-foreground">
                    Role
                  </Label>
                  <Input
                    value={profile.role}
                    onChange={(e) => updateField("role", e.target.value)}
                    className="h-11 bg-muted border-border text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="mono-label text-muted-foreground">
                    Company
                  </Label>
                  <Input
                    value={profile.company}
                    onChange={(e) => updateField("company", e.target.value)}
                    className="h-11 bg-muted border-border text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="mono-label text-muted-foreground">
                  Industry
                </Label>
                <Input
                  value={profile.industry}
                  onChange={(e) => updateField("industry", e.target.value)}
                  className="h-11 bg-muted border-border text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="mono-label text-muted-foreground">
                  Skills
                </Label>
                <Input
                  value={profile.skills.join(", ")}
                  onChange={(e) =>
                    updateField(
                      "skills",
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    )
                  }
                  className="h-11 bg-muted border-border text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="mono-label text-muted-foreground">
                  Interests
                </Label>
                <Input
                  value={profile.interests.join(", ")}
                  onChange={(e) =>
                    updateField(
                      "interests",
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    )
                  }
                  className="h-11 bg-muted border-border text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="mono-label text-muted-foreground">
                  Networking Goal
                </Label>
                <Textarea
                  value={profile.networkingGoal}
                  onChange={(e) =>
                    updateField("networkingGoal", e.target.value)
                  }
                  className="min-h-[80px] bg-muted border-border text-sm resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <Label className="mono-label text-muted-foreground">
                    Looking For
                  </Label>
                  <Textarea
                    value={profile.lookingFor}
                    onChange={(e) => updateField("lookingFor", e.target.value)}
                    className="min-h-[80px] bg-muted border-border text-sm resize-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="mono-label text-muted-foreground">
                    Can Offer
                  </Label>
                  <Textarea
                    value={profile.canOffer}
                    onChange={(e) => updateField("canOffer", e.target.value)}
                    className="min-h-[80px] bg-muted border-border text-sm resize-none"
                  />
                </div>
              </div>
              {error && (
                <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                  <p className="text-destructive text-sm">{error}</p>
                </div>
              )}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={() => {
                    setMode("create");
                    setProfile(null);
                  }}
                  variant="secondary"
                  className="pressable flex-1 h-12 text-sm bg-muted border border-border cursor-pointer"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="pressable-accent flex-1 h-12 font-mono text-sm font-black bg-accent text-primary-foreground hover:bg-primary/90 border-0 cursor-pointer disabled:opacity-30"
                >
                  {loading ? "Generating..." : "Generate Digital Twin"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function DataPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="pressable dev-panel-soft rounded-lg p-5">
      <span className="mono-label mb-1.5 block text-muted-foreground">
        {label}
      </span>
      <p className="text-sm text-foreground leading-relaxed">{value}</p>
    </div>
  );
}
