"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Link2, Loader2, Coffee, Sun, Moon } from "lucide-react";

type TimePeriod = "morning" | "afternoon" | "evening";

const PERIOD_OPTIONS: { value: TimePeriod; label: string; time: string; Icon: typeof Sun }[] = [
  { value: "morning", label: "Morning", time: "9 AM – 12 PM", Icon: Coffee },
  { value: "afternoon", label: "Afternoon", time: "1 – 5 PM", Icon: Sun },
  { value: "evening", label: "Evening", time: "6 – 10 PM", Icon: Moon },
];

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

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
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

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [bioText, setBioText] = useState("");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [linkedInConnected, setLinkedInConnected] = useState(false);
  const [linkedInLoading, setLinkedInLoading] = useState(false);
  const [availability, setAvailability] = useState<TimePeriod[]>([]);

  const handleLinkedInConnect = async () => {
    setLinkedInLoading(true);
    // Simulate OAuth flow delay
    await new Promise((resolve) => setTimeout(resolve, 1800));
    setBioText(MOCK_LINKEDIN_PROFILE);
    setLinkedInConnected(true);
    setLinkedInLoading(false);
  };

  const handleExtract = async () => {
    if (!bioText.trim()) {
      setError("Please paste your bio or connect LinkedIn");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/profile/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedInText: bioText }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setProfile(data.profile);
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to extract");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!name.trim() || !profile) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          availability,
          ...profile,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("userName", data.user.name);
      setStep(3);
    } catch (err: any) {
      setError(err.message || "Failed to create profile");
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    onComplete();
    setStep(1);
    setName("");
    setBioText("");
    setProfile(null);
    setError("");
    setLinkedInConnected(false);
    setAvailability([]);
  };

  const updateField = (field: keyof ProfileData, value: any) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false} className="dev-panel gap-0 overflow-hidden rounded-lg p-0 sm:max-w-[620px]">
        <DialogTitle className="sr-only">Create Your Digital Twin</DialogTitle>

        {/* Step indicator */}
        <div className="px-6 pt-6 pb-4">
          <div className="mb-1 flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`size-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    s <= step
                      ? "bg-accent text-primary-foreground"
                      : "border border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {s < step ? "\u2713" : s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-8 h-0.5 rounded ${s < step ? "bg-accent" : "bg-muted"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Input */}
        {step === 1 && (
          <div className="px-6 pb-6 flex flex-col gap-4 max-h-[65vh] overflow-y-auto">
            <div>
              <span className="mono-label text-primary">Twin setup</span>
              <h2 className="mt-3 font-display text-3xl font-black text-foreground">
                Create Your Twin
              </h2>
              <p className="text-base text-muted-foreground">
                Tell us about yourself so your AI twin can network for you.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="mono-label text-muted-foreground">
                Your Name *
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="h-11 bg-muted border-border font-mono text-sm focus:border-accent focus:ring-accent/20"
              />
            </div>

            {/* Mock LinkedIn Connect */}
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
                value={bioText}
                onChange={(e) => {
                  setBioText(e.target.value);
                  if (linkedInConnected) setLinkedInConnected(false);
                }}
                placeholder="Paste your LinkedIn summary, professional bio, or describe your background, skills, and what you're looking for..."
                className="min-h-[160px] bg-muted border-border text-sm focus:border-accent focus:ring-accent/20 resize-y"
              />
              <p className="text-sm text-muted-foreground">
                The more detail you provide, the better your twin will represent
                you.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                <p className="text-destructive text-base">{error}</p>
              </div>
            )}

            <Button
              onClick={handleExtract}
              disabled={loading || !name.trim() || !bioText.trim()}
              className="pressable-accent h-12 w-full bg-accent font-mono text-sm font-black text-primary-foreground hover:bg-primary/90 border-0 cursor-pointer disabled:opacity-30"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="radar-spinner !size-4" />
                  Extracting your profile...
                </span>
              ) : (
                "Extract Profile with AI"
              )}
            </Button>
          </div>
        )}

        {/* Step 2: Review */}
        {step === 2 && profile && (
          <div className="px-6 pb-6 flex flex-col gap-4 max-h-[65vh] overflow-y-auto">
            <div>
              <span className="mono-label text-primary">Confirm details</span>
              <h2 className="mt-3 font-display text-3xl font-black text-foreground">
                Review Your Profile
              </h2>
              <p className="text-base text-muted-foreground">
                AI extracted these details. Edit anything that doesn&apos;t look
                right.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label className="mono-label text-muted-foreground">
                  Role / Title
                </Label>
                <Input
                  value={profile.role}
                  onChange={(e) => updateField("role", e.target.value)}
                  className="h-10 bg-muted border-border text-sm focus:border-accent"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="mono-label text-muted-foreground">
                  Company
                </Label>
                <Input
                  value={profile.company}
                  onChange={(e) => updateField("company", e.target.value)}
                  className="h-10 bg-muted border-border text-sm focus:border-accent"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="mono-label text-muted-foreground">
                Industry
              </Label>
              <Input
                value={profile.industry}
                onChange={(e) => updateField("industry", e.target.value)}
                className="h-10 bg-muted border-border text-sm focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
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
                className="h-10 bg-muted border-border text-sm focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
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
                className="h-10 bg-muted border-border text-sm focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="mono-label text-muted-foreground">
                Networking Goal
              </Label>
              <Textarea
                value={profile.networkingGoal}
                onChange={(e) => updateField("networkingGoal", e.target.value)}
                className="min-h-[60px] bg-muted border-border text-sm focus:border-accent resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label className="mono-label text-muted-foreground">
                  Looking For
                </Label>
                <Textarea
                  value={profile.lookingFor}
                  onChange={(e) => updateField("lookingFor", e.target.value)}
                  className="min-h-[60px] bg-muted border-border text-sm focus:border-accent resize-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="mono-label text-muted-foreground">
                  Can Offer
                </Label>
                <Textarea
                  value={profile.canOffer}
                  onChange={(e) => updateField("canOffer", e.target.value)}
                  className="min-h-[60px] bg-muted border-border text-sm focus:border-accent resize-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="mono-label text-muted-foreground">
                Availability for Networking
              </Label>
              <p className="text-xs text-muted-foreground mb-1">
                When are you open to meeting people? Your twin will only match with attendees who share the same time slots.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {PERIOD_OPTIONS.map(({ value, label, time, Icon }) => {
                  const selected = availability.includes(value);
                  return (
                    <button
                      key={value}
                      onClick={() => {
                        setAvailability((prev) =>
                          prev.includes(value)
                            ? prev.filter((p) => p !== value)
                            : [...prev, value],
                        );
                      }}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all cursor-pointer ${
                        selected
                          ? "border-accent/40 bg-accent/10"
                          : "border-border bg-muted hover:bg-muted/80"
                      }`}
                    >
                      <Icon className={`size-4 ${selected ? "text-accent" : "text-muted-foreground"}`} />
                      <span className={`font-mono text-[11px] font-bold ${selected ? "text-accent" : "text-muted-foreground"}`}>
                        {label}
                      </span>
                      <span className="text-[9px] text-muted-foreground">{time}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                <p className="text-destructive text-base">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setStep(1);
                  setProfile(null);
                  setError("");
                }}
                variant="secondary"
                className="pressable h-11 flex-1 border border-border bg-muted text-sm hover:bg-muted/80 cursor-pointer"
              >
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={loading}
                className="pressable-accent h-11 flex-1 bg-accent font-mono text-sm font-black text-primary-foreground hover:bg-primary/90 border-0 cursor-pointer disabled:opacity-30"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="radar-spinner !size-3.5" />
                    Creating twin...
                  </span>
                ) : (
                  "Confirm & Generate Twin"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div className="px-6 pb-6 flex flex-col items-center gap-4 text-center py-4">
            <div className="size-16 rounded-full bg-green-400/10 border-2 border-green-400/30 flex items-center justify-center">
              <span className="text-green-300 text-2xl">\u2713</span>
            </div>
            <div>
              <h2 className="font-display text-3xl font-black text-foreground mb-1">
                Twin Created!
              </h2>
              <p className="text-base text-muted-foreground">
                Your digital twin is ready. Head to Event Schedule to set your
                availability, then scan to find your best connections.
              </p>
            </div>
            <Button
              onClick={handleDone}
              className="pressable-accent h-12 w-full bg-accent font-mono text-sm font-black text-primary-foreground hover:bg-primary/90 border-0 cursor-pointer"
            >
              Go to Event Schedule
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
