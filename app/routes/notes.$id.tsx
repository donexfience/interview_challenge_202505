import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigation } from "@remix-run/react";
import { NoteDetail } from "~/components/notes/note-detail";
import { NoteDetailSkeleton } from "~/components/notes/note-detail-skeleton";
import { getNoteById } from "~/services/notes.server";
import { getUserId } from "~/utils/session.server";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const noteId = parseInt(params.id || "", 10);

  if (isNaN(noteId)) {
    throw new Response("Invalid note ID", { status: 400 });
  }
  const userId = await getUserId(request);

  const note = await getNoteById(noteId);
  if (note?.userId !== userId) {
    throw new Response("Unauthorized user. Note not belongs to this user", {
      status: 401,
    });
  }
  console.log(note, "notes ");
  if (!note) {
    throw new Response("Note not found", { status: 404 });
  }

  return json({ note });
}

export default function NoteDetailPage() {
  const { note } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  return (
    <div className="container py-8">
      {isLoading ? <NoteDetailSkeleton /> : <NoteDetail note={note} />}
    </div>
  );
}
