"use client";

import { useEffect, useRef, useState } from "react";
import { AtSign, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { cn } from "@/lib/utils";

export interface UgcVideo {
  /** Public video URL (mp4 / webm). */
  src: string;
  /** Static poster shown before / after the video plays (optional). */
  poster?: string;
  /** Customer handle shown in the lower-left badge. */
  handle: string;
  /** Short caption shown above the handle. */
  caption: string;
  /** Optional credit line (e.g. "Lagos · Makeup"). */
  location?: string;
}

interface UgcVideosProps {
  title?: string;
  eyebrow?: string;
  description?: string;
  hashtag?: string;
  videos?: UgcVideo[];
}

const FALLBACK_VIDEOS: UgcVideo[] = [
  {
    src: "/IMG_6572.MOV",
    handle: "@_simaipek",
    caption: "Terra Lip Liner",
    location: "London",
  },
  {
    src: "/IMG_5725.MOV",
    handle: "@elena.r",
    caption: "Soft bronze for the evening",
    location: "Paris",
  },
  {
    src: "/IMG_6577.MOV",
    handle: "@yuyuan.10",
    caption: "Velvet Nude Lip Gloss",
    location: "China",
  },
  {
    src: "/IMG_9502.MOV",
    handle: "@hadel",
    caption: "Cocoa Bean",
    location: "Iraq",
  },
];

/**
 * UGC ("user generated content") video wall for the Makeup & Beauty
 * department. Customers who tag the maison are surfaced here as quiet,
 * letterboxed vertical reels — no bright gradients, no over-saturated
 * stickers, no shouty autoplay. The tone is the same as the editorial
 * product imagery: bone-coloured, slow, premium.
 *
 * Behaviour:
 *  - Videos autoplay sequentially one after another.
 *  - When a reel finishes, the wall automatically advances to the next reel.
 *  - Clicking any tile plays it immediately; clicking the active tile toggles pause.
 *  - A mute toggle on the active tile allows listening to the audio.
 *  - Fully keyboard accessible — each card is a real button.
 */
export function UgcVideos({
  title = "Inside the Ritual",
  eyebrow = "Tagged by you",
  description = "The LETTY look, captured in real life. Tag @lettybeautyofficial on Instagram or TikTok to be considered for our Beauty Edit.",
  hashtag = "#lettybeautyofficial",
  videos,
}: UgcVideosProps) {
  // If custom videos are supplied, place them first then fill the rest of
  // the wall with fallback reels so the layout always shows 4 tiles.
  const items =
    videos && videos.length > 0
      ? [
          ...videos,
          ...FALLBACK_VIDEOS.slice(videos.length, Math.max(4, 4)),
        ].slice(0, 4)
      : FALLBACK_VIDEOS;

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);

  // Play active video and pause all other videos.
  useEffect(() => {
    setProgress(0);
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === activeIndex) {
        v.muted = muted;
        if (isPlaying) {
          const playPromise = v.play();
          if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(() => {
              /* autoplay blocked or interrupted */
            });
          }
        } else {
          v.pause();
        }
      } else {
        v.pause();
        v.currentTime = 0;
      }
    });
  }, [activeIndex, isPlaying]);

  // Apply mute toggle to the active tile without restarting playback.
  useEffect(() => {
    const v = videoRefs.current[activeIndex];
    if (v) v.muted = muted;
  }, [muted, activeIndex]);

  // Advance to the next reel sequentially when current video finishes
  const handleVideoEnded = (index: number) => {
    if (index === activeIndex) {
      setActiveIndex((prev) => (prev + 1) % items.length);
      setIsPlaying(true);
    }
  };

  const togglePlay = (index: number) => {
    const v = videoRefs.current[index];
    if (!v) return;
    if (activeIndex === index) {
      if (v.paused) {
        v.play().catch(() => {});
        setIsPlaying(true);
      } else {
        v.pause();
        setIsPlaying(false);
      }
    } else {
      setActiveIndex(index);
      setIsPlaying(true);
    }
  };

  return (
    <section
      aria-labelledby="ugc-heading"
      className="border-t border-line bg-ivory"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <Reveal>
          <SectionHeading
            eyebrow={eyebrow}
            title={title}
            description={description}
          />
        </Reveal>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 md:mt-16 md:grid-cols-4">
          {items.map((video, i) => {
            const isActive = activeIndex === i;
            return (
              <Reveal key={`${video.handle}-${i}`} delay={0.06 * i}>
                <button
                  type="button"
                  onClick={() => togglePlay(i)}
                  aria-label={`Play ${video.handle} — ${video.caption}`}
                  aria-pressed={isActive}
                  className={cn(
                    "group relative block aspect-[9/16] w-full overflow-hidden bg-ink text-left shadow-sm transition-shadow duration-500 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ivory",
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
                    }}
                    src={video.src}
                    muted
                    playsInline
                    preload="auto"
                    onEnded={() => handleVideoEnded(i)}
                    onTimeUpdate={(e) => {
                      if (isActive) {
                        const v = e.currentTarget;
                        if (v.duration) {
                          setProgress((v.currentTime / v.duration) * 100);
                        }
                      }
                    }}
                    onPlay={() => {
                      if (i === activeIndex) setIsPlaying(true);
                    }}
                    onPause={() => {
                      if (i === activeIndex && !videoRefs.current[i]?.seeking) {
                        setIsPlaying(false);
                      }
                    }}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                  />

                  {/* Editorial gradient — subtle, never blocks the video */}
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent"
                  />

                  {/* Top-right mute toggle (visible only when this tile is active or hovered) */}
                  <span
                    className={cn(
                      "absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-ivory/40 bg-ink/40 text-ivory backdrop-blur-md transition-opacity duration-300",
                      isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isActive) {
                        setActiveIndex(i);
                        setIsPlaying(true);
                      }
                      setMuted((m) => !m);
                    }}
                    role="button"
                    aria-label={muted ? "Unmute video" : "Mute video"}
                  >
                    {muted ? (
                      <VolumeX className="h-4 w-4" aria-hidden />
                    ) : (
                      <Volume2 className="h-4 w-4" aria-hidden />
                    )}
                  </span>

                  {/* Centered play / pause button — shown when inactive, or active and paused */}
                  <span
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-500",
                      isActive && isPlaying ? "opacity-0" : "opacity-100 group-hover:opacity-100",
                    )}
                  >
                    <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-ivory/60 bg-ink/40 text-ivory backdrop-blur-md transition-transform duration-500 group-hover:scale-105">
                      <Play
                        className="h-5 w-5 translate-x-[1px]"
                        aria-hidden
                      />
                    </span>
                  </span>

                  {/* Bottom info card */}
                  <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-2 p-4 md:p-5">
                    <p className="font-serif text-sm italic leading-snug text-ivory md:text-[15px]">
                      {video.caption}
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-luxe-sm text-ivory/85">
                        <AtSign className="h-3 w-3" aria-hidden />
                        {video.handle}
                      </span>
                      {video.location && (
                        <span className="text-[10px] font-medium uppercase tracking-luxe-sm text-ivory/55">
                          {video.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status indicator when active */}
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute left-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full border border-ivory/40 bg-ink/40 px-2.5 py-1 text-[9px] font-medium uppercase tracking-luxe-sm text-ivory backdrop-blur-md"
                    >
                      {isPlaying ? (
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
                </button>
              </Reveal>
            );
          })}
        </div>

        {/* Hashtag call-to-action */}
        <Reveal delay={0.1}>
          <div className="mt-12 flex flex-col items-center gap-3 text-center">
            <p className="text-xs font-medium uppercase tracking-luxe text-stone">
              Share your ritual
            </p>
            <p className="font-serif text-2xl italic text-ink md:text-3xl">
              {hashtag}
            </p>
            <a
              href="https://instagram.com/lettybeautyofficial"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 border-b border-ink/40 pb-1 text-[11px] font-medium uppercase tracking-luxe-sm text-ink transition-colors hover:border-ink hover:text-stone"
            >
              <AtSign className="h-3.5 w-3.5" aria-hidden />
              Tag @lettybeautyofficial to be featured
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
