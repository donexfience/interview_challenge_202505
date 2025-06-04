import { db, notes, type Note, type NewNote } from "~/db/schema";
import { desc, sql } from "drizzle-orm";

export async function createNote(data: NewNote): Promise<Note> {
  const [note] = await db.insert(notes).values(data).returning();
  return note;
}

export async function getNoteById(id: number): Promise<Note | null> {
  const [note] = await db
    .select()
    .from(notes)
    .where(sql`${notes.id} = ${id}`);
  return note || null;
}

export async function getNotesByUserId(
  userId: number,
  { limit = 10, offset = 0 }: { limit?: number; offset?: number } = {}
): Promise<{ notes: Note[]; totalCount: number }> {
  const notesList = await db
    .select()
    .from(notes)
    .where(sql`${notes.userId} = ${userId}`)
    .orderBy(desc(notes.isStarred), desc(notes.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(notes)
    .where(sql`${notes.userId} = ${userId}`);

  return {
    notes: notesList,
    totalCount: count,
  };
}

export async function toggleNoteStar(noteId: number, userId: number): Promise<Note | null> {
  const [currentNote] = await db
    .select()
    .from(notes)
    .where(sql`${notes.id} = ${noteId} AND ${notes.userId} = ${userId}`)
    .limit(1);

  if (!currentNote) {
    return null;
  }

  const [updatedNote] = await db
    .update(notes)
    .set({ isStarred: !currentNote.isStarred })
    .where(sql`${notes.id} = ${noteId} AND ${notes.userId} = ${userId}`)
    .returning();

  return updatedNote || null;
}

export async function updateNote(
  id: number,
  userId: number,
  data: Partial<NewNote>
): Promise<Note | null> {
  const [note] = await db
    .update(notes)
    .set(data)
    .where(sql`${notes.id} = ${id} AND ${notes.userId} = ${userId}`)
    .returning();
  return note || null;
}

export async function deleteNote(id: number, userId: number): Promise<boolean> {
  const [note] = await db
    .delete(notes)
    .where(sql`${notes.id} = ${id} AND ${notes.userId} = ${userId}`)
    .returning();
  return !!note;
}
