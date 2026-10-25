import {
  Activity, BarChart3, Bell, Building2, CalendarDays, ClipboardList, FileText, Gauge, HeartPulse, Inbox,
  LayoutDashboard, MessageSquare, NotebookPen, Pill, ScrollText, Settings, ShieldCheck, UserCheck, Users, UsersRound,
} from "lucide-react";

export const icons = {
  overview: LayoutDashboard,
  pill: Pill,
  routine: Activity,
  calendar: CalendarDays,
  journal: NotebookPen,
  progress: BarChart3,
  team: UsersRound,
  message: MessageSquare,
  plan: FileText,
  bell: Bell,
  settings: Settings,
  patients: Users,
  monitor: HeartPulse,
  reports: ClipboardList,
  invite: Inbox,
  approve: UserCheck,
  org: Building2,
  audit: ScrollText,
  shield: ShieldCheck,
  gauge: Gauge,
} as const;
export type IconName = keyof typeof icons;
