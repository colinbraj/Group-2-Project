import { Asset, CalendarPost, Lead, DealStage } from '../types';

// Empty leads array - leads are now fetched from Instagram via the Sync button
export const MOCK_LEADS: Lead[] = [];

// Empty assets array - assets are uploaded by user
export const MOCK_ASSETS: Asset[] = [];

export const MOCK_POSTS: CalendarPost[] = [
  { id: 'p1', date: '2023-10-02', title: 'Crisis Leadership Tips', channel: 'LinkedIn', status: 'Published' },
  { id: 'p2', date: '2023-10-02', title: 'Thread on Calmness', channel: 'Twitter', status: 'Published' },
  { id: 'p3', date: '2023-10-05', title: 'Weekly Newsletter', channel: 'Email', status: 'Scheduled' },
  { id: 'p4', date: '2023-10-08', title: 'Client Win Story', channel: 'LinkedIn', status: 'Scheduled' },
  { id: 'p5', date: '2023-10-12', title: 'Q&A Session Invite', channel: 'Instagram', status: 'Scheduled' },
  { id: 'p6', date: '2023-10-15', title: 'New Course Launch', channel: 'LinkedIn', status: 'Scheduled' },
];
