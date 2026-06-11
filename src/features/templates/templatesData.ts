export interface CaptureTemplate {
  id: string;
  name: string;
  mode: 'snippet' | 'link';
  body: string;
  caption: string;
}

export const CAPTURE_TEMPLATES: CaptureTemplate[] = [
  {
    id: 'meeting-notes',
    name: 'Meeting notes',
    mode: 'snippet',
    body: 'Meeting:\nDate:\nAttendees:\n\nNotes:\n- \n\nAction items:\n- ',
    caption: 'Structured notes with action items'
  },
  {
    id: 'bug-report',
    name: 'Bug report',
    mode: 'snippet',
    body: 'Bug:\nSteps to reproduce:\n1. \n\nExpected:\n\nActual:\n',
    caption: 'Repro steps and expected vs actual'
  },
  {
    id: 'bookmark',
    name: 'Bookmark',
    mode: 'link',
    body: 'https://',
    caption: 'Pre-fill a link capture'
  }
];
