import React from 'react';
import { TileDefinition } from './types';
import { 
  HeartHandshake, 
  Mail, 
  Users, 
  Files, 
  AlertTriangle, 
  Calendar, 
  ShieldCheck, 
  BookOpen,
  Globe,
  Link as LinkIcon,
  Star,
  Briefcase,
  Layout,
  MessageSquare,
  Monitor,
  Coffee,
  LucideProps
} from 'lucide-react';

export const IconMap: Record<string, React.FC<LucideProps>> = {
  HeartHandshake,
  Mail,
  Users,
  Files,
  AlertTriangle,
  Calendar,
  ShieldCheck,
  BookOpen,
  Globe,
  Link: LinkIcon,
  Star,
  Briefcase,
  Layout,
  MessageSquare,
  Monitor,
  Coffee
};

export const DEFAULT_TILES: TileDefinition[] = [
  {
    id: 'clearcare',
    label: 'ClearCare',
    url: 'https://example.com/clearcare',
    icon: 'HeartHandshake',
    description: 'Care management system'
  },
  {
    id: 'email',
    label: 'Email',
    url: 'https://outlook.office.com',
    icon: 'Mail',
    description: 'Microsoft Outlook Web'
  },
  {
    id: 'teams',
    label: 'Teams',
    url: 'https://teams.microsoft.com',
    icon: 'Users',
    description: 'Communication & Meetings'
  },
  {
    id: 'sharepoint',
    label: 'SharePoint',
    url: 'https://example.com/sharepoint',
    icon: 'Files',
    description: 'Documents & Intranet'
  },
  {
    id: 'incident',
    label: 'Incident Log',
    url: 'https://example.com/incidents',
    icon: 'AlertTriangle',
    description: 'Safeguarding & Reporting'
  },
  {
    id: 'rota',
    label: 'Staff Rota',
    url: 'https://example.com/rota',
    icon: 'Calendar',
    description: 'Schedules & Shifts'
  },
  {
    id: 'policies',
    label: 'Policies Folder',
    url: 'https://example.com/policies',
    icon: 'ShieldCheck',
    description: 'Procedures & Compliance'
  },
  {
    id: 'ciw',
    label: 'CIW / Regulations',
    url: 'https://careinspectorate.wales',
    icon: 'BookOpen',
    description: 'Reference Area'
  }
];