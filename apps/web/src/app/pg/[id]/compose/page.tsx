"use client";

import { use, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, X, ImageIcon, Link2 } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/shestays/app-shell";
import { AnonymousToggle } from "@/components/shestays/anonymous-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createPost, fetchPg, fetchProfile } from "@/lib/api/adapters";
import { RATING_TAGS, type PostType, type RatingTag } from "@/types/domain";
import { cn } from "@/lib/utils";

export default function ComposePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const { data: pg } = useQuery({ queryKey: ["pg", id], queryFn: () => fetchPg(id) });
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });

  const attachIntent = searchParams.get("attach");
  const [type, setType] = useState<PostType>(() => (attachIntent === "poll" ? "poll" : "review"));
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(() => searchParams.get("anon") === "1");
  const [residency, setResidency] = useState<"stayed_here" | "currently_here" | null>(null);
  const [ratings, setRatings] = useState<Partial<Record<RatingTag, number>>>({});
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkFieldOpen, setLinkFieldOpen] = useState(() => attachIntent === "link");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onImageSelected = (file: File | undefined) => {
    if (!file) return;
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const overallRating =
    Object.values(ratings).length > 0
      ? Number(
          (Object.values(ratings).reduce((s, v) => s + (v ?? 0), 0) / Object.values(ratings).length).toFixed(1)
        )
      : undefined;

  const mutation = useMutation({
    mutationFn: () =>
      createPost({
        pgId: id,
        type,
        title,
        body,
        author: isAnonymous
          ? { isAnonymous: true, anonymousTag: "Anonymous Resident" }
          : { isAnonymous: false, displayName: profile?.displayName ?? "You" },
        residencyClaim: residency,
        ratingTags: type === "review" ? ratings : undefined,
        overallRating: type === "review" ? overallRating : undefined,
        pollOptions:
          type === "poll"
            ? pollOptions.filter((o) => o.trim()).map((label, i) => ({ id: `opt-${i}`, label, voteCount: 0 }))
            : undefined,
        imageUrl: imagePreview ?? undefined,
        linkUrl: linkUrl.trim() || undefined,
      }),
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ["posts", id] });
      toast.success("Posted" + (isAnonymous ? " anonymously" : ""));
      router.push(`/pg/${id}/post/${post.id}`);
    },
    onError: () => toast.error("Couldn't post — try again."),
  });

  const canSubmit =
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    (type !== "poll" || pollOptions.filter((o) => o.trim()).length >= 2);

  return (
    <AppShell>
      <Link
        href={`/pg/${id}`}
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to {pg?.name ?? "community"}
      </Link>

      <h1 className="mb-4 font-heading text-xl font-bold text-heading">New post</h1>

      <div className="space-y-4">
        <Tabs value={type} onValueChange={(v) => setType(v as PostType)}>
          <TabsList>
            <TabsTrigger value="review">Review</TabsTrigger>
            <TabsTrigger value="discussion">Discussion</TabsTrigger>
            <TabsTrigger value="poll">Poll</TabsTrigger>
          </TabsList>
        </Tabs>

        {type === "review" && (
          <div className="rounded-xl border border-border bg-secondary/40 p-3">
            <Label className="mb-2 block text-xs text-muted-foreground">
              Have you actually stayed here? (helps others trust the review — not required)
            </Label>
            <div className="flex gap-2">
              {(["currently_here", "stayed_here"] as const).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setResidency(residency === val ? null : val)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm font-medium",
                    residency === val
                      ? "border-primary bg-primary-soft text-primary-hover"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {val === "currently_here" ? "I currently live here" : "I stayed here before"}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give it a clear title" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="body">{type === "poll" ? "Context" : "Your write-up"}</Label>
          <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} rows={5} />
        </div>

        <div className="space-y-2">
          {imagePreview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
              <img src={imagePreview} alt="" className="max-h-64 w-full rounded-xl border border-border object-cover" />
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(imagePreview);
                  setImagePreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                aria-label="Remove image"
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="size-3.5" />
              Add photo
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onImageSelected(e.target.files?.[0])}
          />

          {linkFieldOpen ? (
            <div className="flex items-center gap-2">
              <Input
                autoFocus
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://…"
                type="url"
              />
              <button
                type="button"
                onClick={() => {
                  setLinkUrl("");
                  setLinkFieldOpen(false);
                }}
                aria-label="Remove link"
                className="text-muted-foreground hover:text-danger"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setLinkFieldOpen(true)}
            >
              <Link2 className="size-3.5" />
              Add link
            </Button>
          )}
        </div>

        {type === "review" && (
          <div className="space-y-2">
            <Label>Rate what applies</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {RATING_TAGS.map((tag) => (
                <div key={tag} className="rounded-lg border border-border p-2">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">{tag}</p>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRatings((r) => ({ ...r, [tag]: n }))}
                        className={cn(
                          "size-5 rounded text-xs font-semibold",
                          (ratings[tag] ?? 0) >= n
                            ? "bg-warning text-white"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {type === "poll" && (
          <div className="space-y-2">
            <Label>Options</Label>
            {pollOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={opt}
                  onChange={(e) =>
                    setPollOptions((opts) => opts.map((o, idx) => (idx === i ? e.target.value : o)))
                  }
                  placeholder={`Option ${i + 1}`}
                />
                {pollOptions.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setPollOptions((opts) => opts.filter((_, idx) => idx !== i))}
                    className="text-muted-foreground hover:text-danger"
                    aria-label="Remove option"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            ))}
            {pollOptions.length < 5 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setPollOptions((o) => [...o, ""])}>
                Add option
              </Button>
            )}
          </div>
        )}

        {profile && (
          <AnonymousToggle isAnonymous={isAnonymous} onChange={setIsAnonymous} displayName={profile.displayName} />
        )}

        <Button className="w-full" disabled={!canSubmit || mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? "Posting…" : "Post"}
        </Button>
      </div>
    </AppShell>
  );
}
