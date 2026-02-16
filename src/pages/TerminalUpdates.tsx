import { useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Bug,
  Wrench,
  Zap,
  Shield,
  Layout,
  Bell,
  MessageSquare,
  ClipboardList,
  BarChart3,
  Users,
  FileText,
  Phone,
  Download,
  type LucideIcon,
} from "lucide-react";
import { format, subDays } from "date-fns";

type UpdateType = "feature" | "fix" | "improvement" | "security";

interface Update {
  title: string;
  description: string;
  type: UpdateType;
  icon: LucideIcon;
}

interface DayBlock {
  date: Date;
  updates: Update[];
}

const typeConfig: Record<UpdateType, { label: string; className: string }> = {
  feature: { label: "New", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400" },
  fix: { label: "Fix", className: "bg-red-500/10 text-red-600 border-red-500/30 dark:text-red-400" },
  improvement: { label: "Improved", className: "bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400" },
  security: { label: "Security", className: "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400" },
};

const today = new Date();

const changelog: DayBlock[] = [
  {
    date: today,
    updates: [
      {
        title: "Task Detail Modal",
        description: "Each task now opens a full detail modal when clicked — showing instructions, priority, status, due date, assigned/created by info, linked account & contact details with clickable email and phone.",
        type: "feature",
        icon: ClipboardList,
      },
      {
        title: "Real-time Message Pop-ups",
        description: "New on-screen toast notifications appear instantly when you receive a chat message or DM while online. Includes sender name, message preview, and a quick-open action.",
        type: "feature",
        icon: MessageSquare,
      },
      {
        title: "Notification Bell Accuracy",
        description: "The notification bell now shows the true unread count from the database instead of being stuck on a fixed number. Badge updates in real-time as you read or receive notifications.",
        type: "fix",
        icon: Bell,
      },
    ],
  },
  {
    date: subDays(today, 1),
    updates: [
      {
        title: "Floating Chat Scroll Fix",
        description: "Resolved an issue where the floating chat window's contact and channel lists were not scrollable. The entire conversation panel now scrolls correctly on all devices.",
        type: "fix",
        icon: MessageSquare,
      },
      {
        title: "Chat Layout Improvements",
        description: "Improved the flexbox layout of the chat window to ensure content never overflows its container. Better experience on smaller screens and tablets.",
        type: "improvement",
        icon: Layout,
      },
    ],
  },
  {
    date: subDays(today, 2),
    updates: [
      {
        title: "Opportunity Detail Redesign",
        description: "The opportunity detail modal received a refresh with a cleaner icon rail, improved stage path visualization, and a streamlined notes section with auto-save.",
        type: "improvement",
        icon: Sparkles,
      },
      {
        title: "SLA Status Indicators",
        description: "Tasks linked to SLA deadlines now show visual urgency badges and overdue warnings. Overdue and due-today tasks are highlighted with color-coded borders in the task list.",
        type: "feature",
        icon: Zap,
      },
    ],
  },
  {
    date: subDays(today, 3),
    updates: [
      {
        title: "Pipeline Board Touch Gestures",
        description: "Added touch drag support for moving opportunity cards between pipeline columns on mobile and tablet devices. Cards can now be dragged with a long-press gesture.",
        type: "feature",
        icon: Layout,
      },
      {
        title: "Click-to-Call Integration",
        description: "Phone numbers throughout the CRM are now clickable to initiate calls through the integrated dialler. Call logs are automatically created and linked to the relevant account.",
        type: "feature",
        icon: Phone,
      },
    ],
  },
  {
    date: subDays(today, 4),
    updates: [
      {
        title: "Reports Dashboard Charts",
        description: "Added interactive pipeline and revenue charts to the Reports page. Charts support date-range filtering and display stage-by-stage conversion metrics.",
        type: "feature",
        icon: BarChart3,
      },
      {
        title: "Data Export Tool",
        description: "Admins can now export accounts, contacts, opportunities, and tasks to CSV from the admin panel. Exports respect role-based access controls.",
        type: "feature",
        icon: FileText,
      },
      {
        title: "Row-Level Security Hardening",
        description: "Tightened database access policies across all tables to ensure users can only access records they are authorized to view. Admin-only routes are now enforced at the data layer.",
        type: "security",
        icon: Shield,
      },
    ],
  },
  {
    date: subDays(today, 5),
    updates: [
      {
        title: "Contact Management Overhaul",
        description: "The Contacts page now supports inline editing, bulk actions, and improved search with filters for account, email domain, and recent activity.",
        type: "improvement",
        icon: Users,
      },
      {
        title: "Preboarding Wizard Auto-save",
        description: "The preboarding wizard now auto-saves progress as you fill out each step. You can close the browser and return exactly where you left off.",
        type: "feature",
        icon: Wrench,
      },
    ],
  },
  {
    date: subDays(today, 6),
    updates: [
      {
        title: "Dark Mode Polish",
        description: "Comprehensive dark mode pass across all pages — improved contrast, fixed badge readability, and ensured all charts and cards use proper themed colors.",
        type: "improvement",
        icon: Layout,
      },
      {
        title: "CSV Import Error Handling",
        description: "The CSV import tool now validates each row before processing and displays clear error messages for malformed data, duplicate entries, and missing required fields.",
        type: "fix",
        icon: Bug,
      },
      {
        title: "Mobile Bottom Navigation",
        description: "Added a fixed bottom navigation bar on mobile with quick access to Pipeline, Tasks, Chat, and Settings for faster one-thumb navigation.",
        type: "feature",
        icon: Layout,
      },
    ],
  },
];

export default function TerminalUpdates() {
  const downloadMarkdown = useCallback(() => {
    const lines: string[] = ["# Terminal Updates\n"];
    changelog.forEach((day) => {
      lines.push(`## ${format(day.date, "EEEE, MMMM d, yyyy")}\n`);
      day.updates.forEach((u) => {
        const tag = typeConfig[u.type].label.toUpperCase();
        lines.push(`- **[${tag}] ${u.title}** — ${u.description}`);
      });
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `terminal-updates-${format(new Date(), "yyyy-MM-dd")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Terminal Updates</h1>
            <p className="text-sm text-muted-foreground mt-1">
              What's new, fixed, and improved — updated daily.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={downloadMarkdown} className="gap-1.5">
            <Download className="h-4 w-4" />
            Download .md
          </Button>
        </div>

        {changelog.map((day, i) => (
          <div key={i} className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-foreground whitespace-nowrap">
                {format(day.date, "EEEE, MMMM d")}
              </h2>
              <Separator className="flex-1" />
            </div>

            <div className="space-y-3">
              {day.updates.map((update, j) => {
                const tConfig = typeConfig[update.type];
                const Icon = update.icon;
                return (
                  <Card key={j} className="transition-colors hover:bg-muted/30">
                    <CardContent className="p-4 flex gap-3">
                      <div className="mt-0.5 flex-shrink-0 h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{update.title}</span>
                          <Badge variant="outline" className={tConfig.className + " text-xs"}>
                            {tConfig.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {update.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
