import { cn } from "@/lib/utils";
import React, { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";

const menuItems = [
  { name: "Cinematic Branding", location: "NEW YORK, USA", number: "01" },
  { name: "Digital Experiences", location: "LONDON, UK", number: "02" },
  { name: "Immersive 3D Design", location: "TOKYO, JAPAN", number: "03" },
  { name: "Motion Graphics", location: "BERLIN, GERMANY", number: "04" },
  { name: "Creative Direction", location: "PARIS, FRANCE", number: "05" },
  { name: "Visual Effects (VFX)", location: "SEOUL, SK", number: "06" },
  { name: "Sonic Landscapes", location: "TORONTO, CA", number: "07" },
];

const videos = [
  "https://media.w3.org/2010/05/sintel/trailer_hd.mp4",
  "https://www.w3schools.com/html/mov_bbb.mp4",
  "https://media.w3.org/2010/05/bunny/trailer.mp4",
  "https://media.w3.org/2010/05/video/movie_300.mp4",
  "https://media.w3.org/2010/05/sintel/trailer_hd.mp4",
  "https://www.w3schools.com/html/mov_bbb.mp4",
  "https://media.w3.org/2010/05/bunny/trailer.mp4",
];

export const Component = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const loadedCountRef = useRef(0);

  const outerContainerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const [mutedStates, setMutedStates] = useState<boolean[]>(() =>
    new Array(videos.length).fill(true)
  );

  const ITEM_HEIGHT = 70;

  const handleVideoLoad = () => {
    loadedCountRef.current += 1;
    if (!isReady && loadedCountRef.current >= 1) {
      setIsReady(true);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleToggleMute = (index: number) => {
    setMutedStates((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  useEffect(() => {
    const handleWindowScroll = () => {
      if (!outerContainerRef.current) return;

      const { top, height } = outerContainerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      const scrollableDistance = height - windowHeight;
      const scrolledPastTop = -top;

      let progress = scrolledPastTop / scrollableDistance;
      progress = Math.max(0, Math.min(1, progress));

      const newActiveIndex = Math.round(progress * (menuItems.length - 1));
      setActiveIndex(newActiveIndex);
    };

    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    handleWindowScroll();

    return () => window.removeEventListener("scroll", handleWindowScroll);
  }, []);

  useEffect(() => {
    videoRefs.current.forEach((videoEl, index) => {
      if (!videoEl) return;

      videoEl.setAttribute("playsinline", "true");
      videoEl.setAttribute("webkit-playsinline", "true");

      if (index === activeIndex) {
        videoEl.muted = mutedStates[index] ?? true;

        const playPromise = videoEl.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            if (
              error.name === "NotAllowedError" ||
              error.name === "NotSupportedError"
            ) {
              videoEl.muted = true;
              videoEl.play().catch(() => {});

              setMutedStates((prev) => {
                const next = [...prev];
                next[index] = true;
                return next;
              });
            }
          });
        }
      } else {
        videoEl.pause();
        if (videoEl.readyState >= 2) {
          videoEl.currentTime = 0;
        }
      }
    });
  }, [activeIndex, mutedStates]);

  const handleMenuClick = (index: number) => {
    if (!outerContainerRef.current) return;

    const targetProgress = index / (menuItems.length - 1);
    const outerRect = outerContainerRef.current.getBoundingClientRect();
    const scrollableDistance =
      outerContainerRef.current.clientHeight - window.innerHeight;
    const absoluteTop = window.scrollY + outerRect.top;
    const targetWindowScrollY =
      absoluteTop + targetProgress * scrollableDistance;

    window.scrollTo({ top: targetWindowScrollY, behavior: "smooth" });
  };

  return (
    <>
      <style>
        {`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

          .mask-y {
            mask-image: linear-gradient(to bottom, black 0%, black 75%, transparent 100%);
            -webkit-mask-image: linear-gradient(to bottom, black 0%, black 75%, transparent 100%);
          }

          .mask-y-video {
            mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
            -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
          }

          .video-track-container {
            --video-height: 250px;
          }
          @media (min-width: 768px) {
            .video-track-container {
              --video-height: 380px;
            }
          }
        `}
      </style>

      <div
        ref={outerContainerRef}
        className={cn("w-full h-[400vh] bg-black relative py-12")}
      >
        {/* شاشة التحميل المتوافقة مع هوية FXD */}
        {!isReady && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
            <div className="text-center px-6 flex flex-col items-center">
              <img src="/FXD.svg" alt="FXD Agency" className="h-8 mb-4 opacity-80" />
              <p className="text-[11px] tracking-[0.4em] uppercase text-zinc-500 font-mono">
                Code / Content / Film / Digital
              </p>
            </div>
          </div>
        )}

        <section className="sticky top-0 w-full h-screen flex items-center justify-center p-4 md:p-10 font-mono overflow-hidden">
          <div className="relative w-full max-w-[1100px] h-[85vh] md:h-[750px] bg-[#0a0a0a] border border-white/10 flex flex-col md:flex-row overflow-hidden shadow-2xl rounded-none">
            
            {/* الشريط الجانبي الأيسر المتوافق مع FXD */}
            <div className="hidden md:flex w-14 flex-col justify-between items-center py-10 border-r border-white/10 z-10 flex-shrink-0 bg-[#050505]">
              <div
                className="text-xs font-mono text-zinc-500 tracking-[0.3em] uppercase"
                style={{
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                }}
              >
                EST. 2026
              </div>
              
              <div className="w-5 h-5 flex items-center justify-center">
                <img src="/Logo.svg" alt="FXD" className="w-full opacity-60" />
              </div>

              <div
                className="text-xs font-mono text-zinc-400 tracking-[0.3em] uppercase"
                style={{
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                }}
              >
                FXD AGENCY
              </div>
            </div>

            {/* القسم الأوسط: العناوين بنمط الخط والألوان الداكنة */}
            <div className="w-full md:flex-1 h-[50%] md:h-full px-6 md:px-16 z-10 flex flex-col justify-end pb-[10%] border-b md:border-b-0 border-white/10 pointer-events-auto bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent">
              <div className="relative w-full h-[250px] md:h-[350px] overflow-hidden mask-y">
                <ul
                  className="absolute left-0 w-full transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
                  style={{
                    top: "50%",
                    marginTop: `-${ITEM_HEIGHT / 2}px`,
                    transform: `translateY(-${activeIndex * ITEM_HEIGHT}px)`,
                  }}
                >
                  {menuItems.map((item, index) => {
                    const isActive = activeIndex === index;
                    const isPast = index < activeIndex;

                    return (
                      <li
                        key={index}
                        onClick={() => !isPast && handleMenuClick(index)}
                        style={{ height: `${ITEM_HEIGHT}px` }}
                        className={`flex items-center cursor-pointer transition-all duration-500 w-full
                          ${isActive ? "opacity-100 scale-100" : ""}
                          ${isPast ? "opacity-0 pointer-events-none scale-95" : ""}
                          ${
                            !isActive && !isPast
                              ? "opacity-25 scale-[0.98] origin-left hover:opacity-50"
                              : ""
                          }`}
                      >
                        <span
                          className={`text-[20px] sm:text-[26px] md:text-[34px] font-mono uppercase tracking-wider transition-colors duration-500
                            ${
                              isActive
                                ? "text-white font-bold"
                                : "text-zinc-500"
                            }`}
                        >
                          <span className="text-zinc-600 text-sm mr-4 tracking-normal font-sans">
                            [{item.number}]
                          </span>
                          {item.name}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* القسم الأيمن: معرض الفيديو */}
            <div className="w-full md:w-[45%] h-[50%] md:h-full overflow-hidden relative z-0 md:border-l border-white/10 bg-[#050505] mask-y-video video-track-container">
              <div
                className="absolute top-1/2 left-0 w-full transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col"
                style={{
                  marginTop: "calc(var(--video-height) / -2)",
                  transform: `translateY(calc(-${activeIndex} * var(--video-height)))`,
                }}
              >
                {videos.map((src, index) => {
                  const isActive = index === activeIndex;

                  return (
                    <div
                      key={index}
                      data-portfolio-item="true"
                      className={`w-full shrink-0 relative group transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] p-4 flex justify-center items-center ${
                        isActive
                          ? "opacity-100 scale-100 blur-none z-10"
                          : "opacity-20 scale-[0.85] blur-[4px] md:blur-[6px] z-0 pointer-events-none"
                      }`}
                      style={{ height: "var(--video-height)" }}
                    >
                      <div className="w-full h-full relative overflow-hidden bg-black border border-white/10 shadow-2xl">
                        <video
                          ref={(el) => {
                            videoRefs.current[index] = el;
                            if (el) {
                              el.defaultMuted = true;
                              el.playsInline = true;
                            }
                          }}
                          src={src}
                          muted={mutedStates[index] ?? true}
                          loop
                          playsInline
                          preload="auto"
                          onLoadedMetadata={handleVideoLoad}
                          className="w-full h-full object-cover transition-transform duration-700"
                          style={{
                            WebkitBackfaceVisibility: "hidden",
                            backfaceVisibility: "hidden",
                            transform: "translateZ(0)",
                          }}
                        />

                        {isActive && (
                          <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md px-2.5 py-1 border border-white/10">
                            <span className="text-white/80 text-[10px] tracking-[0.2em] uppercase font-mono">
                              {menuItems[index].location}
                            </span>
                          </div>
                        )}

                        {isActive && (
                          <button
                            onClick={() => handleToggleMute(index)}
                            className="absolute bottom-4 right-4 z-20 bg-black/60 backdrop-blur-md hover:bg-white hover:text-black text-white p-2.5 transition-all duration-200 border border-white/10"
                            aria-label="Toggle mute"
                          >
                            {mutedStates[index] ? (
                              <VolumeX className="h-4 w-4" />
                            ) : (
                              <Volume2 className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};
