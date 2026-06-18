"use client";

import { useCallback, useEffect, useState } from "react";
import { Pill } from "@/components/academy/shared";
import { InlineVideoPlayer } from "@/components/shared/InlineVideoPlayer";
import { api, ApiError } from "@/lib/api";
import { playerRoutes } from "@/lib/player-nav";
import type { AcademyFeedItem, FeedComment } from "@/lib/repositories/academy-feed";

type PlayerFeedPostProps = {
  academyId: string;
  item: AcademyFeedItem;
  highlighted?: boolean;
};

export function PlayerFeedPost({ academyId, item, highlighted = false }: PlayerFeedPostProps) {
  const [liked, setLiked] = useState(item.likedByViewer);
  const [likeCount, setLikeCount] = useState(item.likeCount);
  const [commentCount, setCommentCount] = useState(item.commentCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [engagementError, setEngagementError] = useState<string | null>(null);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${playerRoutes.home}?post=${item.type}:${item.sourceId}`
      : `${playerRoutes.home}?post=${item.type}:${item.sourceId}`;

  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const result = await api.player.feed.listComments(academyId, item.type, item.sourceId);
      setComments(result.comments);
    } catch {
      setEngagementError("Could not load comments.");
    } finally {
      setLoadingComments(false);
    }
  }, [academyId, item.sourceId, item.type]);

  useEffect(() => {
    if (showComments && comments.length === 0) {
      void loadComments();
    }
  }, [comments.length, loadComments, showComments]);

  async function handleLikeToggle() {
    setEngagementError(null);
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((count) => Math.max(0, count + (nextLiked ? 1 : -1)));

    try {
      const result = await api.player.feed.like(academyId, item.type, item.sourceId);
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch {
      setLiked(liked);
      setLikeCount(item.likeCount);
      setEngagementError("Could not update like.");
    }
  }

  async function handleShare() {
    setEngagementError(null);
    try {
      if (navigator.share) {
        await navigator.share({
          title: item.drillName,
          text: item.subtitle ?? item.drillName,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch {
      setEngagementError("Could not share post.");
    }
  }

  async function handleAddComment(event: React.FormEvent) {
    event.preventDefault();
    if (!commentBody.trim()) {
      return;
    }

    setSubmittingComment(true);
    setEngagementError(null);
    try {
      const result = await api.player.feed.addComment(
        academyId,
        item.type,
        item.sourceId,
        commentBody.trim()
      );
      setComments((prev) => [result.comment, ...prev]);
      setCommentCount((count) => count + 1);
      setCommentBody("");
    } catch (err) {
      setEngagementError(err instanceof ApiError ? err.message : "Could not post comment.");
    } finally {
      setSubmittingComment(false);
    }
  }

  return (
    <article
      id={`feed-${item.type}--${item.sourceId}`}
      className={`bg-white border rounded-[18px] overflow-hidden mb-3.5 min-w-0 ${
        highlighted ? "border-brand ring-2 ring-brand/20" : "border-line"
      }`}
    >
      <div className="flex items-center gap-2.5 p-3.5 min-w-0">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
          style={{ background: item.authorColor }}
        >
          {item.authorInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[13.5px] text-ink flex items-center gap-1.5 min-w-0">
            <span className="truncate">{item.authorName}</span>
            {item.authorKind === "player" ? (
              <span
                className="w-[15px] h-[15px] rounded-full bg-blue flex items-center justify-center shrink-0"
                aria-hidden="true"
              >
                <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-white" fill="currentColor">
                  <path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </span>
            ) : null}
          </div>
          <div className="text-[11.5px] text-muted truncate">
            {item.sportName}
            {item.batchName ? ` · ${item.batchName}` : ""} · {item.timeAgo}
          </div>
        </div>
        <Pill variant="green">Coach-verified</Pill>
      </div>

      <InlineVideoPlayer
        src={item.videoUrl}
        posterGradient={item.thumbnailGradient}
        durationSeconds={item.durationSeconds}
        tag={item.sportName}
        variant="feed"
        ariaLabel={`Play ${item.drillName}`}
        className="rounded-none"
      />

      <div className="px-3.5 py-3 min-w-0">
        <div className="font-bold text-[13px] text-ink mb-1">{item.drillName}</div>
        {item.subtitle ? (
          <p className="text-[12.5px] text-muted leading-relaxed">{item.subtitle}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-4 px-3.5 pb-3.5 text-[12.5px] text-muted">
        <button
          type="button"
          onClick={handleLikeToggle}
          className={`inline-flex items-center gap-1.5 min-h-[44px] font-semibold ${
            liked ? "text-brand" : "text-muted"
          }`}
        >
          <span aria-hidden="true">{liked ? "♥" : "♡"}</span>
          {likeCount}
        </button>
        <button
          type="button"
          onClick={() => setShowComments((open) => !open)}
          className="inline-flex items-center gap-1.5 min-h-[44px] font-semibold"
        >
          <span aria-hidden="true">💬</span>
          {commentCount}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 min-h-[44px] font-semibold"
        >
          Share
        </button>
      </div>

      {engagementError ? (
        <p className="px-3.5 pb-2 text-[12px] text-red-600">{engagementError}</p>
      ) : null}

      {showComments ? (
        <div className="border-t border-line px-3.5 py-3 min-w-0">
          {loadingComments ? (
            <p className="text-[12px] text-muted">Loading comments…</p>
          ) : (
            <ul className="space-y-2 mb-3">
              {comments.length === 0 ? (
                <li className="text-[12px] text-muted">No comments yet.</li>
              ) : (
                comments.map((comment) => (
                  <li key={comment.id} className="min-w-0">
                    <div className="text-[12px] font-semibold text-ink">{comment.authorName}</div>
                    <div className="text-[12.5px] text-text">{comment.body}</div>
                    <div className="text-[11px] text-muted">{comment.timeAgo}</div>
                  </li>
                ))
              )}
            </ul>
          )}
          <form onSubmit={handleAddComment} className="flex gap-2 min-w-0">
            <input
              type="text"
              value={commentBody}
              onChange={(event) => setCommentBody(event.target.value)}
              placeholder="Add a comment…"
              className="flex-1 min-w-0 min-h-[44px] rounded-[10px] border border-line px-3 text-[13px]"
            />
            <button
              type="submit"
              disabled={submittingComment || !commentBody.trim()}
              className="shrink-0 min-h-[44px] px-3 rounded-[10px] bg-brand text-white text-[12px] font-semibold disabled:opacity-50"
            >
              Post
            </button>
          </form>
        </div>
      ) : null}
    </article>
  );
}
