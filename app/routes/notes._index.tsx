import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { useLoaderData, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { useSearchParams } from "@remix-run/react";
import { PlusIcon } from "@radix-ui/react-icons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "~/components/ui/page-header";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "~/components/ui/pagination";
import { NotesGrid } from "~/components/notes/notes-grid";
import { NotesGridSkeleton } from "~/components/notes/note-skeleton";
import { NoteForm } from "~/components/notes/note-form";
import { requireUserId } from "~/services/session.server";
import { createNote, getNotesByUserId } from "~/services/notes.server";
import { noteSchema } from "~/schemas/notes";

// --- PAGINATION CONTROLLER ---
function PaginationController({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const prevPage = Math.max(page - 1, 1);
  const nextPage = Math.min(page + 1, totalPages);

  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  return (
    <Pagination className="mt-6 justify-center">
      <PaginationContent className="gap-2">
        <PaginationItem>
          <PaginationLink
            href={`?page=${prevPage}`}
            isActive={false}
            aria-disabled={isFirstPage}
            className={`px-3 py-2 rounded-md border text-sm font-medium ${
              isFirstPage
                ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                : "hover:bg-accent hover:text-accent-foreground"
            }`}
            onClick={(e) => {
              if (isFirstPage) e.preventDefault();
            }}
          >
            Previous
          </PaginationLink>
        </PaginationItem>

        <PaginationItem>
          <span className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold">
            {page}
          </span>
        </PaginationItem>

        <PaginationItem>
          <PaginationLink
            href={`?page=${nextPage}`}
            isActive={false}
            aria-disabled={isLastPage}
            className={`px-3 py-2 rounded-md border text-sm font-medium ${
              isLastPage
                ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                : "hover:bg-accent hover:text-accent-foreground"
            }`}
            onClick={(e) => {
              if (isLastPage) e.preventDefault();
            }}
          >
            Next
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);

  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);
  const offset = (page - 1) * limit;

  const { notes, totalCount } = await getNotesByUserId(userId, {
    limit,
    offset,
  });
  console.log(totalCount, "toal count");
  const totalPages = Math.ceil(totalCount / limit);

  return json({ notes, page, limit, totalCount, totalPages });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const formData = await request.formData();
  const data = {
    title: formData.get("title"),
    description: formData.get("description"),
  };

  const result = noteSchema.safeParse(data);

  if (!result.success) {
    return json(
      {
        success: false,
        errors: result.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  try {
    const note = await createNote({
      ...result.data,
      userId,
    });

    return json({ success: true, note });
  } catch (error) {
    console.error("Failed to create note:", error);
    return json({ error: "Failed to create note" }, { status: 500 });
  }
}

export default function NotesIndexPage() {
  const { notes, page, totalPages, totalCount } =
    useLoaderData<typeof loader>();
  const [isOpen, setIsOpen] = useState(false);
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  return (
    <div className="h-full min-h-screen bg-background">
      <div className="container px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="mx-auto space-y-8">
          <PageHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <PageHeaderHeading>Notes</PageHeaderHeading>
                <PageHeaderDescription>
                  Manage your notes and thoughts in one place.
                </PageHeaderDescription>
              </div>
              <Button onClick={() => setIsOpen(true)} disabled={isLoading}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Create Note
              </Button>
            </div>
          </PageHeader>

          <Separator />

          {isOpen ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Create Note</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </CardHeader>
              <CardContent>
                <NoteForm onSuccess={() => setIsOpen(false)} />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Your Notes</CardTitle>
              <CardDescription>
                A list of all your notes. Click on a note to view its details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? <NotesGridSkeleton /> : <NotesGrid notes={notes} />}
              <div className="mt-2 text-sm text-muted-foreground">
                Showing page {page} of {totalPages} ({totalCount} notes)
              </div>
              <PaginationController page={page} totalPages={totalPages} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
