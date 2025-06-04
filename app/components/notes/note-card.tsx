import { Link, useFetcher } from "@remix-run/react";
import { Star } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { type Note } from "~/db/schema";
import { formatRelativeTime } from "~/utils/date";

type SerializedNote = Omit<Note, "createdAt"> & { createdAt: string };

interface NoteCardProps {
  note: SerializedNote;
}

export function NoteCard({ note }: NoteCardProps) {
  const fetcher = useFetcher();
  const isStarred = fetcher.formData
    ? fetcher.formData.get("isStarred") === "true"
    : note.isStarred;

  const handleStarToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    fetcher.submit(
      {
        noteId: note.id.toString(),
        isStarred: (!isStarred).toString(),
        intent: "toggleStar",
      },
      { method: "post", action: "/api/notes/star" }
    );
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-none">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 flex-1">
            <Link to={`/notes/${note.id}`} className="hover:underline">
              {note.title}
            </Link>
          </CardTitle>
          <button
            onClick={handleStarToggle}
            className={`flex-shrink-0 p-1 rounded-sm transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
              fetcher.state === "submitting"
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            aria-label={
              isStarred ? "Remove from favorites" : "Add to favorites"
            }
            disabled={fetcher.state === "submitting"}
          >
            <Star
              size={16}
              className={`transition-colors ${
                isStarred
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-400 hover:text-yellow-400"
              }`}
            />
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {note.description || ""}
        </p>
      </CardContent>
      <CardFooter className="flex-none border-t pt-4">
        <div className="flex items-center justify-between w-full">
          <p className="text-xs text-muted-foreground">
            {formatRelativeTime(note.createdAt)}
          </p>
          {isStarred && (
            <div className="flex items-center gap-1">
              <Star size={12} className="fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-muted-foreground">Starred</span>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
