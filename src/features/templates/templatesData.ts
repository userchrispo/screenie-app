import type { CaptureTemplate } from '../../domain/captureTemplate';

export type { CaptureTemplate } from '../../domain/captureTemplate';

export const CAPTURE_TEMPLATES: CaptureTemplate[] = [
  {
    id: 'meeting-notes',
    name: 'Meeting notes',
    mode: 'snippet',
    category: 'notes',
    tone: 'violet',
    caption: 'Structured notes with action items',
    description: 'Capture attendees, discussion, and follow-ups in one pass.',
    tags: ['meeting', 'notes'],
    body: 'Meeting:\nDate:\nAttendees:\n\nNotes:\n- \n\nAction items:\n- '
  },
  {
    id: 'standup',
    name: 'Daily standup',
    mode: 'snippet',
    category: 'notes',
    tone: 'violet',
    caption: 'Yesterday, today, blockers',
    description: 'A quick three-line status update.',
    tags: ['standup', 'notes'],
    body: 'Yesterday:\n- \n\nToday:\n- \n\nBlockers:\n- '
  },
  {
    id: 'bug-report',
    name: 'Bug report',
    mode: 'snippet',
    category: 'dev',
    tone: 'teal',
    caption: 'Repro steps and expected vs actual',
    description: 'Document a defect with everything a fix needs.',
    tags: ['bug', 'dev'],
    body: 'Bug:\nSteps to reproduce:\n1. \n\nExpected:\n\nActual:\n\nEnvironment:\n'
  },
  {
    id: 'code-snippet',
    name: 'Code snippet',
    mode: 'snippet',
    category: 'dev',
    tone: 'teal',
    caption: 'Reusable code with context',
    description: 'Save a snippet with a short note on what it does.',
    tags: ['code', 'dev'],
    body: 'What it does:\n\nCode:\n```\n\n```\n\nSource:'
  },
  {
    id: 'research-source',
    name: 'Research source',
    mode: 'snippet',
    category: 'research',
    tone: 'amber',
    caption: 'Quote, takeaway, and citation',
    description: 'Keep a key quote with your own takeaway.',
    tags: ['research', 'source'],
    body: 'Source:\nQuote:\n"\n"\n\nTakeaway:\n\nLink:'
  },
  {
    id: 'bookmark',
    name: 'Bookmark',
    mode: 'link',
    category: 'research',
    tone: 'blue',
    caption: 'Pre-fill a link capture',
    description: 'Drop a URL to read or revisit later.',
    tags: ['bookmark', 'read-later'],
    body: 'https://'
  },
  {
    id: 'reading-list',
    name: 'Reading list',
    mode: 'link',
    category: 'personal',
    tone: 'green',
    caption: 'Save something to read later',
    description: 'A link tagged for your personal reading queue.',
    tags: ['reading', 'personal'],
    body: 'https://'
  }
];
