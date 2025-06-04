import { type ActionFunctionArgs, json } from "@remix-run/node";
import { toggleNoteStar } from "~/services/notes.server";
import { requireUserId } from "~/services/session.server";

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  
  const noteId = formData.get("noteId");
  const intent = formData.get("intent");
  
  if (intent !== "toggleStar" || typeof noteId !== "string") {
    return json({ error: "Invalid request" }, { status: 400 });
  }
  
  const noteIdNum = parseInt(noteId, 10);
  if (isNaN(noteIdNum)) {
    return json({ error: "Invalid note ID" }, { status: 400 });
  }
  
  try {
    const updatedNote = await toggleNoteStar(noteIdNum, userId);
    
    if (!updatedNote) {
      return json({ error: "Note not found" }, { status: 404 });
    }
    
    return json({ 
      success: true, 
      note: updatedNote 
    });
  } catch (error) {
    console.error("Error toggling note star:", error);
    return json({ error: "Failed to toggle star" }, { status: 500 });
  }
}