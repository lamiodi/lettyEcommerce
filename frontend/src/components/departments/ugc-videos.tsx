"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play, ShoppingBag, Volume2, VolumeX } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { cn } from "@/lib/utils";
import { UgcVideo, DEFAULT_UGC_VIDEOS } from "@/lib/data/ugc-videos";

export type { UgcVideo };

interface UgcVideosProps {
  title?: string;
  eyebrow?: string;
  description?: string;
  hashtag?: string;
  videos?: UgcVideo[];
}

/**
 * UGC ("user generated content") video wall for the Makeup & Beauty
 * department. Customers who tag the maison are surfaced here as quiet,
 * letterboxed vertical reels — no bright gradients, no over-saturated
 * stickers, no shouty autoplay. The tone is the same as the editorial
 * product imagery: bone-coloured, slow, premium.
 *
 * Featured products can be tapped directly to jump to the matching product
 * and auto-select that shade on the PDP!
 */
export function UgcVideos({
  title,
  eyebrow,
  description,
  hashtag = "#lettybeautyofficial",
  videos: initialVideos,
}: UgcVideosProps) {
  const items = useMemo(() => {
    if (initialVideos && initialVideos.length > 0) return initialVideos;
    return DEFAULT_UGC_VIDEOS;
  }, [initialVideos]);

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [unmutedIndex, setUnmutedIndex] = useState<number | null>(null);
  const [playingMap, setPlayingMap] = useState<Record<number, boolean>>({});
  const [progress, setProgress] = useState(0);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const railRef = useRef<HTMLDivElement | null>(null);
  const tileRefs = useRef<Array<HTMLDivElement | null>>([]);
  const manuallyPausedRef = useRef(false);

  const safePlay = useCallback((video: HTMLVideoElement) => {
    try {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          // Autoplay handled safely
        });
      }
    } catch {
      // Ignore
    }
  }, []);

  const safePause = useCallback((video: HTMLVideoElement) => {
    try {
      video.pause();
    } catch {
      // Ignore
    }
  }, []);

  /** Pause every tile except `keepPlaying` — exactly one reel plays at a
   *  time so simultaneous motion never competes for the customer's eye. */
  const playExclusively = useCallback(
    (keepPlaying: number) => {
      manuallyPausedRef.current = false;
      videoRefs.current.forEach((v, idx) => {
        if (!v) return;
        if (idx === keepPlaying) {
          v.muted = unmutedIndex !== idx;
          safePlay(v);
        } else {
          safePause(v);
        }
      });
    },
    [safePlay, safePause, unmutedIndex],
  );

  // User-controlled playback: when the active reel finishes, keep it paused
  // at the end. Do NOT auto-advance or auto-scroll to the next video by itself;
  // all scrolling and reel switching is driven explicitly by the customer.
  const handleEnded = useCallback(
    (index: number) => {
      setPlayingMap((prev) => ({ ...prev, [index]: false }));
      setProgress(100);
      const v = videoRefs.current[index];
      if (v) {
        safePause(v);
      }
    },
    [safePause],
  );

  const scrollToIndex = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= items.length) return;
      setActiveIndex(idx);
      setProgress(0);
      playExclusively(idx);
      tileRefs.current[idx]?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    },
    [items.length, playExclusively],
  );

  const handlePrev = useCallback(() => {
    const prev = (activeIndex - 1 + items.length) % items.length;
    scrollToIndex(prev);
  }, [activeIndex, items.length, scrollToIndex]);

  const handleNext = useCallback(() => {
    const next = (activeIndex + 1) % items.length;
    scrollToIndex(next);
  }, [activeIndex, items.length, scrollToIndex]);

  // Viewport IntersectionObserver: the active reel plays only while it is
  // actually on screen; everything else stays paused.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = tileRefs.current.indexOf(entry.target as HTMLDivElement);
          if (idx === -1) return;
          const video = videoRefs.current[idx];
          if (!video) return;

          if (entry.isIntersecting) {
            if (idx === activeIndex && !manuallyPausedRef.current) {
              video.muted = unmutedIndex !== idx;
              safePlay(video);
            }
          } else {
            safePause(video);
          }
        });
      },
      {
        root: null,
        rootMargin: "80px 0px 80px 0px",
        threshold: 0.1,
      },
    );

    tileRefs.current.forEach((tile) => {
      if (tile) observer.observe(tile);
    });

    return () => observer.disconnect();
  }, [items.length, activeIndex, unmutedIndex, safePlay, safePause]);

  // Keep audio strictly synchronized: only unmutedIndex has sound
  useEffect(() => {
    videoRefs.current.forEach((v, idx) => {
      if (v) {
        v.muted = unmutedIndex !== idx;
      }
    });
  }, [unmutedIndex]);

  // Mobile horizontal rail observer: the centered card becomes the one
  // playing; any previously playing reel is paused first.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const mql = window.matchMedia("(min-width: 768px)");
    if (mql.matches) return;

    const railObserver = new IntersectionObserver(
      (entries) => {
        let bestEntry: IntersectionObserverEntry | null = null;
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio)
          ) {
            bestEntry = entry;
          }
        });
        if (bestEntry) {
          const idx = tileRefs.current.indexOf(
            (bestEntry as IntersectionObserverEntry).target as HTMLDivElement,
          );
          if (idx !== -1 && idx !== activeIndex) {
            setActiveIndex(idx);
            setProgress(0);
            playExclusively(idx);
          }
        }
      },
      {
        root: rail,
        threshold: 0.5,
      },
    );

    tileRefs.current.forEach((tile) => {
      if (tile) railObserver.observe(tile);
    });

    return () => railObserver.disconnect();
  }, [items.length, activeIndex, playExclusively]);

  const togglePlay = (index: number) => {
    const v = videoRefs.current[index];
    if (!v) return;
    if (index !== activeIndex) {
      setActiveIndex(index);
      setProgress(0);
      playExclusively(index);
      return;
    }
    if (v.paused) {
      playExclusively(index);
    } else {
      manuallyPausedRef.current = true;
      safePause(v);
    }
  };

  const toggleMute = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (unmutedIndex === index) {
      setUnmutedIndex(null);
      return;
    }
    setUnmutedIndex(index);
    if (index !== activeIndex) {
      setActiveIndex(index);
      setProgress(0);
      playExclusively(index);
    } else {
      const v = videoRefs.current[index];
      if (v && v.paused && !manuallyPausedRef.current) {
        safePlay(v);
      }
    }
  };

  return (
    <section
      aria-labelledby="ugc-heading"
      className="border-t border-line bg-ivory"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        {(eyebrow || title || description) && (
          <Reveal>
            <SectionHeading
              eyebrow={eyebrow}
              title={title || ""}
              description={description}
            />
          </Reveal>
        )}

        {/* Horizontal swipeable rail on mobile (< md) / 4-col grid on desktop (>= md) */}
        <div
          ref={railRef}
          className={cn(
            "flex w-full gap-3.5 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:p-0",
            (eyebrow || title || description) ? "mt-10 md:mt-16" : "",
          )}
        >
          {items.map((video, i) => {
            const isActive = activeIndex === i;
            const productHref = video.productSlug
              ? `/products/${video.productSlug}${video.productShade ? `?shade=${encodeURIComponent(video.productShade)}` : ""}`
              : null;

            return (
              <div
                key={`${video.handle}-${video.id || i}`}
                ref={(el) => {
                  tileRefs.current[i] = el;
                }}
                className="w-[74vw] max-w-[290px] shrink-0 snap-center md:w-auto md:max-w-none md:shrink md:snap-align-none"
              >
                <Reveal delay={0.06 * i} className="h-full w-full">
                  <div
                    tabIndex={0}
                    role="button"
                    onClick={() => togglePlay(i)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        togglePlay(i);
                      }
                    }}
                    aria-label={`Play ${video.handle} — ${video.caption}`}
                    aria-pressed={isActive}
                    className={cn(
                      "group relative block aspect-[9/16] w-full overflow-hidden rounded-2xl md:rounded-none bg-ink text-left shadow-sm transition-all duration-500 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ivory cursor-pointer select-none",
                      isActive && "ring-1 ring-gold/60",
                    )}
                  >
                    {/* Luxe progress indicator for sequential autoplay */}
                    {isActive && (
                      <div className="absolute inset-x-0 top-0 z-30 h-1 bg-ivory/20">
                        <div
                          className="h-full bg-gold transition-all duration-150 ease-linear"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}

                    <video
                      ref={(el) => {
                        videoRefs.current[i] = el;
                        if (el) {
                          el.muted = unmutedIndex !== i;
                          el.defaultMuted = true;
                        }
                      }}
                      src={video.src}
                      poster={video.poster}
                      muted={unmutedIndex !== i}
                      playsInline
                      preload="none"
                      onPlay={() => {
                        setPlayingMap((prev) => ({ ...prev, [i]: true }));
                      }}
                      onPause={() => {
                        setPlayingMap((prev) => ({ ...prev, [i]: false }));
                      }}
                      onEnded={() => {
                        setPlayingMap((prev) => ({ ...prev, [i]: false }));
                        handleEnded(i);
                      }}
                      onTimeUpdate={(e) => {
                        if (isActive) {
                          const v = e.currentTarget;
                          if (v.duration) {
                            setProgress((v.currentTime / v.duration) * 100);
                          }
                        }
                      }}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                    />

                    {/* Editorial gradient — subtle, never blocks the video */}
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent pointer-events-none"
                    />

                    {/* Top-right mute toggle */}
                    <button
                      type="button"
                      className={cn(
                        "absolute right-3 top-3 z-30 inline-flex h-9 w-9 items-center justify-center rounded-full border border-ivory/40 bg-ink/40 text-ivory backdrop-blur-md transition-opacity duration-300 hover:bg-ink/70",
                        isActive || unmutedIndex === i ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                      )}
                      onClick={(e) => toggleMute(e, i)}
                      aria-label={unmutedIndex === i ? "Mute video" : "Unmute video"}
                    >
                      {unmutedIndex === i ? (
                        <Volume2 className="h-4 w-4 text-gold" aria-hidden />
                      ) : (
                        <VolumeX className="h-4 w-4 text-ivory" aria-hidden />
                      )}
                    </button>

                    {/* Centered play / pause button — shown when paused or on hover */}
                    <div
                      aria-hidden
                      className={cn(
                        "pointer-events-none absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-300",
                        playingMap[i]
                          ? "opacity-0 group-hover:opacity-100"
                          : "opacity-100",
                      )}
                    >
                      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-ivory/60 bg-ink/40 text-ivory backdrop-blur-md transition-transform duration-300 group-hover:scale-105 shadow-lg">
                        {playingMap[i] ? (
                          <Pause className="h-5 w-5 text-ivory" aria-hidden />
                        ) : (
                          <Play
                            className="h-5 w-5 translate-x-[1px] text-ivory"
                            aria-hidden
                          />
                        )}
                      </span>
                    </div>

                    {/* Status indicator when active */}
                    {isActive && (
                      <span
                        aria-hidden
                        className="absolute left-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full border border-ivory/40 bg-ink/40 px-2.5 py-1 text-[9px] font-medium uppercase tracking-luxe-sm text-ivory backdrop-blur-md"
                      >
                        {playingMap[i] ? (
                          <>
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
                            Now playing
                          </>
                        ) : (
                          <>
                            <Pause className="h-2.5 w-2.5 text-ivory/70" />
                            Paused
                          </>
                        )}
                      </span>
                    )}

                    {/* Bottom info card + Interactive Product link */}
                    <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-2 p-3.5 md:p-4">
                      {/* Creator handle and caption */}
                      <div className="flex flex-col gap-0.5">
                        <p className="font-serif text-[13px] sm:text-sm italic leading-snug text-ivory line-clamp-2">
                          &ldquo;{video.caption}&rdquo;
                        </p>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <span className="text-[10px] font-medium uppercase tracking-luxe-sm text-ivory/85">
                            {video.handle}
                          </span>
                          {video.location && (
                            <span className="text-[9px] font-medium uppercase tracking-luxe-sm text-ivory/50">
                              {video.location}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tap to shop tagged product */}
                      {productHref && (
                        <Link
                          href={productHref}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="group/pill relative z-30 mt-1 flex items-center justify-between gap-2 rounded-xl border border-ivory/30 bg-ink/75 p-2 backdrop-blur-md transition-all duration-200 hover:border-gold hover:bg-ink/95 shadow-md active:scale-[0.98]"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            {video.productImage ? (
                              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-ivory/40 bg-secondary/30 shadow-xs ring-1 ring-gold/30">
                                <Image
                                  src={video.productImage}
                                  alt={video.productName || "Product thumbnail"}
                                  fill
                                  className="object-cover object-center transition-transform duration-300 group-hover/pill:scale-105"
                                  sizes="36px"
                                />
                              </div>
                            ) : (
                              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-ivory/30 bg-ivory/10 text-ivory">
                                <ShoppingBag className="h-4 w-4" />
                              </div>
                            )}
                            <div className="flex min-w-0 flex-col leading-tight">
                              <span className="truncate text-[11px] font-medium text-ivory transition-colors group-hover/pill:text-gold">
                                {video.productName}
                              </span>
                              <span className="truncate text-[9px] text-ivory/70">
                                {video.productShade ? `Shade: ${video.productShade}` : ""}
                                {video.productPrice ? ` · ${video.productPrice}` : ""}
                              </span>
                            </div>
                          </div>
                          <span className="shrink-0 flex items-center gap-1 rounded-full bg-ivory/15 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-gold transition-colors group-hover/pill:bg-gold group-hover/pill:text-ink">
                            Shop <ArrowRight className="h-2.5 w-2.5 transition-transform group-hover/pill:translate-x-0.5" />
                          </span>
                        </Link>
                      )}
                    </div>
                  </div>
                </Reveal>
              </div>
            );
          })}
        </div>

        {/* Mobile / Tablet Manual Pagination & Arrow Controls (scrolled by user) */}
        <div className="mt-5 flex items-center justify-center gap-3 md:hidden">
          <button
            type="button"
            aria-label="Previous video"
            onClick={handlePrev}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-line bg-white/80 text-ink shadow-xs transition-colors hover:bg-white active:scale-95"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <div className="flex items-center gap-1.5">
            {items.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Go to video ${idx + 1}`}
                onClick={() => scrollToIndex(idx)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  activeIndex === idx ? "w-6 bg-gold" : "w-1.5 bg-line",
                )}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Next video"
            onClick={handleNext}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-line bg-white/80 text-ink shadow-xs transition-colors hover:bg-white active:scale-95"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Community Callout */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-line pt-8 text-center sm:flex-row sm:text-left">
          <div>
            <p className="font-serif text-sm font-medium text-ink">
              Be Part of the Editorial
            </p>
            <p className="mt-0.5 text-xs text-stone">
              Share your daily ritual with {hashtag} for a feature on our world.
            </p>
          </div>
          <a
            href="https://instagram.com/lettybeautyofficial"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-white/60 px-4 py-2 text-xs font-medium uppercase tracking-luxe text-ink backdrop-blur-sm transition-all hover:border-stone hover:bg-white"
          >
            Follow on Instagram
            <span aria-hidden>↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}
