
import React from 'react';
import {
  FolderOpen,
  CalendarDays,
  Users,
  LogOut,
  MoreVertical,
  Linkedin,
  Twitter,
  Mail,
  MessageCircle,
  Video,
  FileText,
  Mic,
  File,
  Inbox
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'vault', label: 'Content Vault', icon: <FolderOpen size={20} /> },
  { id: 'calendar', label: 'Calendar', icon: <CalendarDays size={20} /> },
  { id: 'inbox', label: 'Social Inbox', icon: <Inbox size={20} /> },
  { id: 'leads', label: 'Leads & Pipeline', icon: <Users size={20} /> },
];

export const CHANNEL_ICONS = {
  LinkedIn: <Linkedin size={16} className="text-blue-700" />,
  Twitter: <Twitter size={16} className="text-sky-500" />,
  Email: <Mail size={16} className="text-orange-500" />,
  Instagram: <div className="w-4 h-4 bg-gradient-to-tr from-yellow-400 to-purple-600 rounded-sm" />, // Simple simulation
  WhatsApp: <MessageCircle size={16} className="text-green-500" />
};

export const ASSET_ICONS = {
  Video: <Video size={18} className="text-purple-500" />,
  Audio: <Mic size={18} className="text-pink-500" />,
  PDF: <FileText size={18} className="text-red-500" />,
  Text: <File size={18} className="text-blue-500" />
};