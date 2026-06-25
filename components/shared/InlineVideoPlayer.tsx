"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VideoIcon } from "@/components/academy/icons";
import { formatVideoDuration } from "@/lib/format";
import { useNearViewport } from "@/lib/hooks/use-near-viewport";

const DEFAULT_POSTER = "linear-gradient(135deg, #0E1B33, #1E335C)";
const CONTROLS_HIDE_MS = 2500;

export type InlineVideoPlayerVariant = "feed" | "review" | "detail" | "preview";

export type InlineVideoPlayerProps = {
  src: string | null;
  posterGradient?: string | null;
  durationSeconds?: number | null;
  tag?: string;
  variant?: InlineVideoPlayerVariant;
  objectFit?: "cover" | "contain";
  className?: string;
  ariaLabel?: string;
  videoKey?: string;
  videoStyle?: React.CSSProperties;
  onCanPlay?: () => void;
  onLoadedData?: () => void;
  onError?: () => void;
};

const variantWrapperClass: Record<InlineVideoPlayerVariant, string> = {
  feed: "h-[208px]",
  review: "min-h-[180px]",
  detail: "min-h-[200px] max-h-[min(52vh,420px)]",
  preview: "min-h-[140px] max-h-[220px]",
};

function PlayFab({ large = true }: { large?: boolean }) {
  const size = large ? "w-14 h-14" : "w-11 h-11";
  const iconSize = large ? "w-6 h-6" : "w-5 h-5";
  return (
    <span
      className={`${size} rounded-full bg-white/92 flex items-center justify-center shadow-lg min-h-[44px] min-w-[44px]`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`${iconSize} text-ink ml-0.5`}
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M8 5v14l11-7z" />
      </svg>
    </span>
  );
}

function PauseIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
    </svg>
  );
}

function MuteIcon({ muted, className = "w-5 h-5" }: { muted: boolean; className?: string }) {
  if (muted) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2c0-1.77-1.02-3.29-2.5-4.03v8.06c1.48-.74 2.5-2.26 2.5-4.03zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z" />
    </svg>
  );
}

function FullscreenIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
    </svg>
  );
}

function BufferingSpinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-[2] pointer-events-none">
      <div className="w-10 h-10 rounded-full border-2 border-white/30 border-t-white animate-spin" />
    </div>
  );
}

const FEED_POSTER_SEEK_SECONDS = 0.1;

type FeedPosterChromeProps = {
  tag?: string;
  durationSeconds?: number | null;
  ariaLabel: string;
  onActivate: () => void;
};

function FeedPosterChrome({ tag, durationSeconds, ariaLabel, onActivate }: FeedPosterChromeProps) {
  return (
    <>
      {tag ? (
        <span className="absolute top-3 left-3 text-[11px] font-semibold bg-black/45 text-white px-2.5 py-1 rounded-full z-10">
          {tag}
        </span>
      ) : null}
      <button
        type="button"
        onClick={onActivate}
        className="absolute inset-0 flex items-center justify-center z-[2]"
        aria-label={ariaLabel}
      >
        <PlayFab />
      </button>
      {durationSeconds != null && durationSeconds > 0 ? (
        <span className="absolute bottom-3 right-3 text-[11px] font-semibold bg-black/55 text-white px-2 py-1 rounded-md z-10">
          {formatVideoDuration(durationSeconds)}
        </span>
      ) : null}
    </>
  );
}

type FeedVideoPosterProps = {
  src: string;
  poster: string;
  tag?: string;
  durationSeconds?: number | null;
  ariaLabel: string;
  wrapperClass: string;
  onActivate: () => void;
};

/** Paused first-frame preview for feed cards — lazy-loaded near viewport. */
function FeedVideoPoster({
  src,
  poster,
  tag,
  durationSeconds,
  ariaLabel,
  wrapperClass,
  onActivate,
}: FeedVideoPosterProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref: containerRef, near } = useNearViewport({ rootMargin: "200px" });
  const [frameReady, setFrameReady] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);

  useEffect(() => {
    setFrameReady(false);
    setPosterFailed(false);
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || posterFailed) return;

    if (near) {
      if (video.getAttribute("src") !== src) {
        video.src = src;
        video.load();
      }
      return;
    }

    video.removeAttribute("src");
    video.load();
    setFrameReady(false);
  }, [near, src, posterFailed]);

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    const target = Math.min(
      FEED_POSTER_SEEK_SECONDS,
      Number.isFinite(video.duration) && video.duration > 0 ? video.duration * 0.05 : FEED_POSTER_SEEK_SECONDS
    );
    if (video.currentTime < target - 0.01) {
      try {
        video.currentTime = target;
      } catch {
        setFrameReady(true);
      }
    } else {
      setFrameReady(true);
    }
  };

  const handleSeeked = () => setFrameReady(true);

  const handlePosterError = () => {
    setPosterFailed(true);
    setFrameReady(false);
    const video = videoRef.current;
    if (video) {
      video.removeAttribute("src");
      video.load();
    }
  };

  if (posterFailed) {
    return (
      <div ref={containerRef} className={wrapperClass} style={{ background: poster }}>
        <FeedPosterChrome
          tag={tag}
          durationSeconds={durationSeconds}
          ariaLabel={ariaLabel}
          onActivate={onActivate}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`${wrapperClass} bg-black`}>
      {near ? (
        <video
          ref={videoRef}
          playsInline
          muted
          preload="metadata"
          onLoadedMetadata={handleLoadedMetadata}
          onSeeked={handleSeeked}
          onLoadedData={() => setFrameReady(true)}
          onError={handlePosterError}
          className="w-full h-full object-cover"
        />
      ) : null}

      {near && !frameReady ? <BufferingSpinner /> : null}

      <FeedPosterChrome
        tag={tag}
        durationSeconds={durationSeconds}
        ariaLabel={ariaLabel}
        onActivate={onActivate}
      />
    </div>
  );
}

type VideoSurfaceProps = {
  src: string;
  videoKey?: string;
  fit: "cover" | "contain";
  videoStyle?: React.CSSProperties;
  variant: InlineVideoPlayerVariant;
  tag?: string;
  durationSeconds?: number | null;
  ariaLabel: string;
  onCanPlay?: () => void;
  onLoadedData?: () => void;
  onError?: () => void;
  wrapperClass: string;
};

function VideoSurface({
  src,
  videoKey,
  fit,
  videoStyle,
  variant,
  tag,
  durationSeconds,
  ariaLabel,
  onCanPlay,
  onLoadedData,
  onError,
  wrapperClass,
}: VideoSurfaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrubbingRef = useRef(false);

  const isPreview = variant === "preview";
  const isFeed = variant === "feed";
  const showFullscreen = variant !== "preview";

  const [isPaused, setIsPaused] = useState(isPreview ? false : isFeed ? true : false);
  const [currentTime, setCurrentTime] = useState(0);
  const [scrubTime, setScrubTime] = useState<number | null>(null);
  const [duration, setDuration] = useState(durationSeconds ?? 0);
  const [buffering, setBuffering] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [muted, setMuted] = useState(isFeed);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHideControls = useCallback(() => {
    clearHideTimer();
    if (isPaused) return;
    hideTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, CONTROLS_HIDE_MS);
  }, [clearHideTimer, isPaused]);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    scheduleHideControls();
  }, [scheduleHideControls]);

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      if (isFeed && video.muted) {
        video.muted = false;
        setMuted(false);
      }
      void video.play();
      setIsPaused(false);
    } else {
      video.pause();
      setIsPaused(true);
    }
    revealControls();
  }, [isFeed, revealControls]);

  const seekTo = useCallback(
    (time: number) => {
      const video = videoRef.current;
      if (!video || !Number.isFinite(time)) return;
      const clamped = Math.max(0, Math.min(time, video.duration || duration || 0));
      video.currentTime = clamped;
      setCurrentTime(clamped);
      revealControls();
    },
    [duration, revealControls]
  );

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    revealControls();
  }, [revealControls]);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container) return;

    const webkitVideo = video as HTMLVideoElement & {
      webkitEnterFullscreen?: () => void;
    };

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (webkitVideo?.webkitEnterFullscreen) {
        webkitVideo.webkitEnterFullscreen();
      } else {
        await container.requestFullscreen();
      }
    } catch {
      if (webkitVideo?.webkitEnterFullscreen) {
        try {
          webkitVideo.webkitEnterFullscreen();
        } catch {
          // Fullscreen may be blocked by browser policy.
        }
      }
    }
    revealControls();
  }, [revealControls]);

  useEffect(() => {
    setIsPaused(isPreview ? false : isFeed ? true : false);
    setCurrentTime(0);
    setScrubTime(null);
    setDuration(durationSeconds ?? 0);
    setBuffering(false);
    setControlsVisible(true);
    setMuted(isFeed);
    clearHideTimer();
  }, [src, variant, videoKey, isPreview, isFeed, durationSeconds, clearHideTimer]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || isFeed) return;
    void video.play().catch(() => {
      setIsPaused(true);
    });
  }, [src, videoKey, isFeed]);

  useEffect(() => {
    if (!isPaused && controlsVisible) {
      scheduleHideControls();
    } else {
      clearHideTimer();
      if (isPaused) {
        setControlsVisible(true);
      }
    }
    return clearHideTimer;
  }, [isPaused, controlsVisible, scheduleHideControls, clearHideTimer]);

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    if (Number.isFinite(video.duration) && video.duration > 0) {
      setDuration(Math.floor(video.duration));
    }
    onLoadedData?.();
  };

  const handleCanPlay = () => {
    setBuffering(false);
    onCanPlay?.();
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || scrubbingRef.current) return;
    setCurrentTime(video.currentTime);
  };

  const handlePlay = () => setIsPaused(false);
  const handlePause = () => setIsPaused(true);

  const handleEnded = () => {
    setIsPaused(true);
    setControlsVisible(true);
    clearHideTimer();
  };

  const handleWaiting = () => setBuffering(true);
  const handlePlaying = () => setBuffering(false);

  const handleSurfaceClick = () => {
    togglePlayPause();
  };

  const beginScrub = useCallback(
    (value: number) => {
      scrubbingRef.current = true;
      setScrubTime(value);
      revealControls();
    },
    [revealControls]
  );

  const updateScrub = useCallback((value: number) => {
    setScrubTime(value);
  }, []);

  const endScrub = useCallback(
    (value: number) => {
      scrubbingRef.current = false;
      setScrubTime(null);
      seekTo(value);
    },
    [seekTo]
  );

  const effectiveDuration = duration > 0 ? duration : durationSeconds ?? 0;
  const progressMax = Math.max(effectiveDuration, 1);
  const progressValue = Math.min(scrubTime ?? currentTime, progressMax);
  const progressPercent = progressMax > 0 ? (progressValue / progressMax) * 100 : 0;
  const showCenterControl = isPaused || controlsVisible;

  return (
    <div
      ref={containerRef}
      className={`${wrapperClass} bg-black group`}
      onMouseMove={revealControls}
      onTouchStart={revealControls}
    >
      <video
        key={videoKey ?? src}
        ref={videoRef}
        src={src}
        playsInline
        preload="metadata"
        muted={muted}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
        onError={onError}
        className={`w-full h-full ${fit === "cover" ? "object-cover" : "object-contain"}`}
        style={videoStyle}
      />

      {tag && controlsVisible ? (
        <span className="absolute top-3 left-3 text-[11px] font-semibold bg-black/45 text-white px-2.5 py-1 rounded-full z-[3] pointer-events-none">
          {tag}
        </span>
      ) : null}

      {buffering ? <BufferingSpinner /> : null}

      <button
        type="button"
        onClick={handleSurfaceClick}
        className="absolute inset-0 z-[1] cursor-pointer border-0 bg-transparent p-0"
        aria-label={isPaused ? ariaLabel : "Pause video"}
      />

      {showCenterControl ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            togglePlayPause();
          }}
          className="absolute inset-0 z-[4] flex items-center justify-center border-0 bg-transparent p-0 cursor-pointer transition-opacity duration-200"
          aria-label={isPaused ? ariaLabel : "Pause video"}
        >
          <span
            className={`transition-opacity duration-200 ${
              isPaused ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            } ${controlsVisible ? "opacity-100" : ""}`}
          >
            {isPaused ? (
              <PlayFab large />
            ) : (
              <span className="w-11 h-11 rounded-full bg-black/40 flex items-center justify-center min-h-[44px] min-w-[44px]">
                <PauseIcon className="w-5 h-5 text-white" />
              </span>
            )}
          </span>
        </button>
      ) : null}

      <div
        className={`absolute inset-x-0 bottom-0 z-[5] bg-gradient-to-t from-black/85 via-black/50 to-transparent pt-8 pb-2 px-3 transition-[opacity,transform] duration-300 ease-out ${
          controlsVisible
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-1 pointer-events-none"
        }`}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="relative mb-2.5 h-1.5 rounded-full bg-white/25 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-white"
            style={{ width: `${progressPercent}%` }}
          />
          <input
            type="range"
            min={0}
            max={progressMax}
            step={0.05}
            value={progressValue}
            aria-label="Seek video"
            aria-valuemin={0}
            aria-valuemax={progressMax}
            aria-valuenow={Math.floor(progressValue)}
            className="absolute inset-0 w-full h-full appearance-none cursor-pointer bg-transparent opacity-0 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full"
            onPointerDown={(event) => {
              beginScrub(Number(event.currentTarget.value));
            }}
            onInput={(event) => {
              updateScrub(Number(event.currentTarget.value));
            }}
            onPointerUp={(event) => {
              endScrub(Number(event.currentTarget.value));
            }}
            onPointerCancel={(event) => {
              endScrub(Number(event.currentTarget.value));
            }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-sm pointer-events-none"
            style={{ left: `calc(${progressPercent}% - 6px)` }}
          />
        </div>

        <div className="flex items-center gap-1 text-white">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              togglePlayPause();
            }}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
            aria-label={isPaused ? "Play" : "Pause"}
          >
            {isPaused ? (
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <PauseIcon />
            )}
          </button>

          <span className="text-[11px] font-medium tabular-nums min-w-[72px]">
            {formatVideoDuration(Math.floor(scrubTime ?? currentTime))}
            <span className="text-white/60"> / </span>
            {formatVideoDuration(effectiveDuration)}
          </span>

          <div className="flex-1" />

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              toggleMute();
            }}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            <MuteIcon muted={muted} />
          </button>

          {showFullscreen ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void toggleFullscreen();
              }}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
              aria-label="Fullscreen"
            >
              <FullscreenIcon />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function InlineVideoPlayer({
  src,
  posterGradient,
  durationSeconds,
  tag,
  variant = "review",
  objectFit,
  className = "",
  ariaLabel = "Play video",
  videoKey,
  videoStyle,
  onCanPlay,
  onLoadedData,
  onError,
}: InlineVideoPlayerProps) {
  const [activated, setActivated] = useState(variant === "preview");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setActivated(variant === "preview");
    setHasError(false);
  }, [src, variant]);

  const fit = objectFit ?? (variant === "feed" ? "cover" : "contain");
  const poster = posterGradient ?? DEFAULT_POSTER;
  const wrapperClass =
    `${variantWrapperClass[variant]} relative w-full flex items-center justify-center overflow-hidden rounded-xl min-w-0 ${className}`.trim();

  function handleError() {
    setHasError(true);
    onError?.();
  }

  if (!src) {
    return (
      <div className={wrapperClass} style={{ background: poster }}>
        <VideoIcon className="w-10 h-10 text-white/90" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`${wrapperClass} bg-surface border border-line`}>
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-6 text-center">
          <VideoIcon className="w-8 h-8 text-muted2" />
          <p className="text-[13px] text-muted max-w-[260px]">
            This video couldn&apos;t be loaded. Check the link or try again later.
          </p>
        </div>
      </div>
    );
  }

  if (variant === "preview" || activated) {
    return (
      <VideoSurface
        src={src}
        videoKey={videoKey}
        fit={fit}
        videoStyle={videoStyle}
        variant={variant}
        tag={tag}
        durationSeconds={durationSeconds}
        ariaLabel={ariaLabel}
        onCanPlay={onCanPlay}
        onLoadedData={onLoadedData}
        onError={handleError}
        wrapperClass={wrapperClass}
      />
    );
  }

  if (variant === "feed") {
    return (
      <FeedVideoPoster
        src={src}
        poster={poster}
        tag={tag}
        durationSeconds={durationSeconds}
        ariaLabel={ariaLabel}
        wrapperClass={wrapperClass}
        onActivate={() => setActivated(true)}
      />
    );
  }

  return (
    <div className={wrapperClass} style={{ background: poster }}>
      <FeedPosterChrome
        tag={tag}
        durationSeconds={durationSeconds}
        ariaLabel={ariaLabel}
        onActivate={() => setActivated(true)}
      />
    </div>
  );
}
