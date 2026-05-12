import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Scale,
  ClipboardList,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Field Guide — VECTOR AI Eval",
};

const ARCHETYPES = [
  {
    icon: "A",
    name: "The Astronaut",
    priority: "PRIORITY HIRE",
    priorityColor: "text-[oklch(0.78_0.17_65)]",
    priorityBg: "bg-[oklch(0.22_0.06_65)] border-[oklch(0.78_0.17_65/0.3)]",
    cardBorder: "border-[oklch(0.78_0.17_65/0.25)]",
    cardBg: "bg-[oklch(0.22_0.06_65/0.4)]",
    iconColor: "text-[oklch(0.78_0.17_65)]",
    iconBg: "bg-[oklch(0.22_0.06_65)] border-[oklch(0.78_0.17_65/0.4)]",
    tagline: "Move Fast, Don't Lose Them",
    description:
      "These are the people who don't just want a job — they want to build something that matters. They see VECTOR AI not as an employer but as a launchpad. They think in exponential terms and move before being told to.",
    warning:
      "Don't over-index. Astronauts can be unpredictable — tendency to double-cross or leave when work isn't glamorous. A few Astronauts surrounded by strong Pilots is the winning formula.",
    traits: ["Exponential thinker", "Mission-driven", "High agency", "Builds before being asked"],
    signals: [
      "Built side projects or startups — even failed ones",
      "Asks about our vision and products, not just salary",
      "Respectfully challenges something you said — they're thinking, not nodding",
      "Talks about problems they want to solve, not roles they want to fill",
      "References our work — did their homework before the booth",
    ],
  },
  {
    icon: "P",
    name: "The Pilot",
    priority: "STRONG HIRE",
    priorityColor: "text-[oklch(0.62_0.21_255)]",
    priorityBg: "bg-[oklch(0.18_0.07_255)] border-[oklch(0.62_0.21_255/0.3)]",
    cardBorder: "border-[oklch(0.62_0.21_255/0.25)]",
    cardBg: "bg-[oklch(0.18_0.07_255/0.4)]",
    iconColor: "text-[oklch(0.62_0.21_255)]",
    iconBg: "bg-[oklch(0.18_0.07_255)] border-[oklch(0.62_0.21_255/0.4)]",
    tagline: "The Backbone of Every Great Team",
    description:
      "Steady, calm, and consistently growing. They might not have explosive ambition but have reliability, depth, and a compounding growth curve. They show up, learn, improve, and stay.",
    warning: null,
    note: "A team of all Astronauts crashes into the sun. Pilots keep the ship flying. Don't undervalue this archetype.",
    traits: ["Consistent growth", "Reliable under pressure", "Deep learner", "Team-first mentality"],
    signals: [
      "Strong academic record paired with genuine understanding (not just rote)",
      "Talks about mastering a skill, not just using it",
      "Held responsibilities — class rep, society lead, family business, tutoring",
      "Calm under hard questions — doesn't panic, thinks",
      "Asks about learning culture, mentorship, growth paths",
    ],
  },
  {
    icon: "B",
    name: "The Bus Driver",
    priority: "CONDITIONAL",
    priorityColor: "text-[oklch(0.65_0.01_264)]",
    priorityBg: "bg-[oklch(0.19_0.005_264)] border-[oklch(0.65_0.01_264/0.3)]",
    cardBorder: "border-[oklch(0.65_0.01_264/0.25)]",
    cardBg: "bg-[oklch(0.19_0.005_264/0.4)]",
    iconColor: "text-[oklch(0.65_0.01_264)]",
    iconBg: "bg-[oklch(0.19_0.005_264)] border-[oklch(0.65_0.01_264/0.4)]",
    tagline: "Only If There's a Very Specific Role Fit",
    description:
      "Technically competent but on autopilot. They know how to get from A to B but won't suggest a better route. Skilled but not innovative. Capable but not hungry. Execute what's asked and nothing more.",
    warning: null,
    note: "If tagging someone as a Bus Driver, ask: is there a reason they're not a Pilot? Sometimes the answer reveals more about the conversation than the person.",
    traits: ["Technically skilled", "Low initiative", "Comfort-zone bound", "Does the job, nothing more"],
    signals: [
      "Good answers to textbook questions, blank stares at 'what would you build?'",
      "No side projects, no curiosity projects, no 'I was messing around with...'",
      "Asks about work-life balance before asking about the work itself",
      "Passive in conversation — answers questions but never drives them",
      "Their ideal role description sounds like a government job posting",
    ],
  },
  {
    icon: "T",
    name: "The Taxi Rider",
    priority: "PASS",
    priorityColor: "text-[oklch(0.55_0.2_25)]",
    priorityBg: "bg-[oklch(0.2_0.06_25)] border-[oklch(0.55_0.2_25/0.3)]",
    cardBorder: "border-[oklch(0.55_0.2_25/0.25)]",
    cardBg: "bg-[oklch(0.2_0.06_25/0.4)]",
    iconColor: "text-[oklch(0.55_0.2_25)]",
    iconBg: "bg-[oklch(0.2_0.06_25)] border-[oklch(0.55_0.2_25/0.4)]",
    tagline: "Protect the Team",
    description:
      "Grasshoppers. They hop between companies and commitments based on whatever looks shinier. Not building a career — optimizing for the next ride. They'll join for 4 months, pad their CV, and leave for a 10% bump.",
    warning:
      "A Taxi Rider might score well technically. That makes them more dangerous, not less — they'll absorb knowledge, context, and relationships, then take it all to the next stop.",
    traits: ["Grasshopper mentality", "Optimizes for short-term", "Low loyalty signal", "CV-padding mindset"],
    signals: [
      "First questions are about salary, remote policy, and leave days",
      "Already done 3 internships at 3 different places and can't explain why they left",
      "Compares you to other companies at the fair, out loud, to your face",
      "Name-drops brands rather than describing what they actually did there",
      "Seems to be collecting offers, not looking for a home",
    ],
  },
];

const DIMENSIONS = [
  {
    name: "Technical Depth",
    range: "1 → 10",
    low: "Surface-level buzzwords",
    high: "Builds in their sleep",
    strong: "Built projects independently, understands trade-offs, can whiteboard a system on the spot",
    avg: "Solid coursework knowledge, some projects, needs guidance on architecture",
    weak: "Can recite definitions but can't apply them, no real building experience",
  },
  {
    name: "Personality",
    range: "1 → 10",
    low: "Going through the motions",
    high: "Would build at 2 AM for fun",
    strong: "Infectious energy, asks sharp questions, visibly excited about technology and building",
    avg: "Pleasant, engaged, but playing it safe — not showing their real self yet",
    weak: "Robotic, rehearsed answers, no spark, treats it like a transaction",
  },
  {
    name: "Communication & Body Language",
    range: "1 → 10",
    low: "Can't hold eye contact",
    high: "Commands a room naturally",
    strong: "Steady eye contact, structured thinking out loud, comfortable with silence, articulate",
    avg: "Gets the point across but stumbles under pressure, decent but not polished",
    weak: "Avoids eye contact, mumbles, can't organize thoughts, visibly uncomfortable",
  },
  {
    name: "Khandani Pan",
    range: "1 → 10",
    low: "No anchor",
    high: "Person you'd trust with your keys",
    strong: "Talks about family, obligations, or long-term goals naturally, shows maturity beyond their age",
    avg: "Seems stable but hard to read — give them the benefit of the doubt",
    weak: "Entitled attitude, no sense of sacrifice, everything is about 'what's in it for me'",
  },
];

const TIEBREAKERS = [
  {
    scenario: "Astronaut vs. Pilot?",
    rule: "Tag Pilot",
    reason:
      "Astronaut is reserved for the ones who make you feel something. If you're debating, they're not one.",
  },
  {
    scenario: "Pilot vs. Bus Driver?",
    rule: "Tag Pilot",
    reason:
      "Give them the benefit of the doubt. Some people don't show their best self at a crowded fair booth.",
  },
  {
    scenario: "Bus Driver vs. Taxi Rider?",
    rule: "Tag Bus Driver",
    reason:
      "We'd rather miss a flight risk than wrongly label someone as disloyal.",
  },
  {
    scenario: "Both evaluators disagree?",
    rule: "Lower tag wins",
    reason: "We err on the side of caution with people, not with opportunities.",
  },
];

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-12">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Internal Briefing — Job Fair 2026
          </span>
        </div>
        <h1 className="text-2xl font-bold">Field Guide</h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          We're not collecting resumes — we're identifying the next lions joining the pride.
          Keep this open while you're at the booth.
        </p>
      </div>

      {/* Ground Rules */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Booth Rules</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            "Two evaluators per candidate minimum. Score independently, align on archetype after they leave.",
            "3–5 minutes per person max. Astronaut? Give more. Taxi Rider? Wrap up warmly but quickly.",
            "Don't score during the conversation. Listen, engage, be present. Fill in the moment they walk away.",
            "Capture metadata immediately — location, degree/batch. You won't remember tomorrow.",
            "Be welcoming. We came from FAST. These could be the next us. Everyone deserves respect.",
          ].map((rule, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-3.5"
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-secondary text-[10px] font-bold text-muted-foreground mt-0.5">
                {i + 1}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{rule}</p>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* Scoring Dimensions */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">The Four Dimensions</h2>
        <div className="space-y-3">
          {DIMENSIONS.map((dim) => (
            <div
              key={dim.name}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-4 py-3">
                <p className="text-sm font-semibold">{dim.name}</p>
                <span className="text-xs text-muted-foreground font-mono">
                  {dim.low} → {dim.high}
                </span>
              </div>
              <div className="grid grid-cols-3 divide-x divide-border">
                <div className="p-3 space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                    8–10 Strong
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{dim.strong}</p>
                </div>
                <div className="p-3 space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                    5–7 Average
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{dim.avg}</p>
                </div>
                <div className="p-3 space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-red-400">
                    1–4 Weak
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{dim.weak}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* Archetypes */}
      <section className="space-y-6">
        <h2 className="text-base font-semibold">The Four Archetypes</h2>
        <div className="space-y-4">
          {ARCHETYPES.map((a) => (
            <div
              key={a.name}
              className={cn("rounded-xl border p-5 space-y-4", a.cardBorder, a.cardBg)}
            >
              {/* Header */}
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold border",
                    a.iconBg,
                    a.iconColor
                  )}
                >
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{a.name}</h3>
                    <span
                      className={cn(
                        "inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold tracking-widest border",
                        a.priorityBg,
                        a.priorityColor
                      )}
                    >
                      {a.priority}
                    </span>
                  </div>
                  <p className={cn("text-xs mt-0.5", a.iconColor)}>{a.tagline}</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {a.description}
              </p>

              {/* Warning / Note */}
              {a.warning && (
                <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400 mt-0.5" />
                  <p className="text-xs text-amber-200/80 leading-relaxed">{a.warning}</p>
                </div>
              )}
              {(a as { note?: string }).note && (
                <div className="flex items-start gap-2.5 rounded-lg border border-border bg-secondary/40 p-3">
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {(a as { note?: string }).note}
                  </p>
                </div>
              )}

              {/* Traits */}
              <div className="flex flex-wrap gap-1.5">
                {a.traits.map((t) => (
                  <span
                    key={t}
                    className={cn(
                      "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium",
                      a.iconBg,
                      a.iconColor,
                      a.cardBorder
                    )}
                  >
                    {t}
                  </span>
                ))}
              </div>

              {/* Signals */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Signals to watch for
                </p>
                <div className="space-y-1.5">
                  {a.signals.map((s) => (
                    <div key={s} className="flex items-start gap-2">
                      {a.priority === "PASS" ? (
                        <XCircle className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", a.iconColor)} />
                      ) : (
                        <CheckCircle2 className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", a.iconColor)} />
                      )}
                      <p className="text-xs text-muted-foreground">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* Tiebreakers */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Tiebreaker Rules</h2>
        </div>
        <div className="space-y-2">
          {TIEBREAKERS.map(({ scenario, rule, reason }) => (
            <div
              key={scenario}
              className="flex items-start gap-4 rounded-lg border border-border bg-card p-4"
            >
              <div className="min-w-[140px]">
                <p className="text-xs text-muted-foreground">{scenario}</p>
                <p className="text-sm font-semibold mt-0.5 text-foreground">→ {rule}</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed border-l border-border pl-4">
                {reason}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <div className="pb-8 text-center">
        <p className="text-sm italic text-muted-foreground">
          The lions return, this time as a pack.
        </p>
      </div>
    </div>
  );
}
