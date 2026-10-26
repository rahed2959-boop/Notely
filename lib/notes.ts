export type Note = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  archived: boolean;
};

export const NOTES_STORAGE_KEY = "notely.notes.v1";

export const STARTER_NOTES: Note[] = [
  {
    id: "starter-keep-close",
    title: "Keep the good ideas close",
    body: "A small place for the thoughts that deserve another look. Add a note, pin what matters, and let the rest wait quietly.",
    tags: ["welcome", "ideas"],
    createdAt: "2026-10-24T09:30:00.000Z",
    updatedAt: "2026-10-24T09:30:00.000Z",
    pinned: true,
    archived: false,
  },
  {
    id: "starter-sunday-reset",
    title: "Sunday reset",
    body: "Plan the week lightly: choose one important thing, one small errand, and one hour that belongs to me.",
    tags: ["personal", "planning"],
    createdAt: "2026-10-25T17:15:00.000Z",
    updatedAt: "2026-10-25T17:15:00.000Z",
    pinned: false,
    archived: false,
  },
  {
    id: "starter-archive-example",
    title: "A finished thought",
    body: "Archived notes stay searchable whenever I need to remember where an idea started.",
    tags: ["archive"],
    createdAt: "2026-10-20T11:10:00.000Z",
    updatedAt: "2026-10-20T11:10:00.000Z",
    pinned: false,
    archived: true,
  },
];

export function createNoteId() {
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatNoteDate(value: string) {
  const date = new Date(value);
  const now = new Date();
  const isSameDay = date.toDateString() === now.toDateString();
  if (isSameDay) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}
