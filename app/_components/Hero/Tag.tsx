"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Tag() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLImageElement>(null);
  const logo1Ref = useRef<HTMLImageElement>(null);
  const logo2Ref = useRef<HTMLImageElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=80%",
          scrub: 0.6,
          pin: true,
        },
      });

      tl.to(frameRef.current, {
        x: "41.5cqi", 
        ease: "power1.inOut",
      })
        .to(frameRef.current, {
        y: "14.4cqi",  
        color: "#fff",
        rotate: 0,
        ease: "power1.out",
      })
        .set([frameRef.current, logo1Ref.current], { opacity: 0 })
        .set(logo2Ref.current, { opacity: 1 })
        .to(logo2Ref.current, {
        scale: 0.75,
        x: "-24cqi",
        y: "12cqi",
        duration: 1,
        ease: "power2.out",
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen bg-black px-6 overflow-hidden border-b border-white/10"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full max-w-[1120px] aspect-[1120/560] -translate-y-[4vh] scale-[0.82] @container">

          <img
            src="/FXD.svg"
            alt="FXD"
            className="absolute"
            style={{
              left: "14.6%",
              top: "21.4%",
              width: "19.2%",
            }}
          />

          <img
            ref={frameRef}
            src="/Frame-1.svg"
            alt=""
            aria-hidden="true"
            className="absolute z-10"
            style={{
              left: "29%",
              top: "18.8%",
              width: "9.4%",
            }}
          />

          <p
            className="absolute font-mono uppercase text-white/45 whitespace-nowrap"
            style={{
              left: "38.8%",
              top: "30.5%",
              fontSize: "clamp(9px, 1.35vw, 15px)",
              letterSpacing: "0.22em",
            }}
          >
            Code / Content / Film / Digital
          </p>

          <img
            src="/Agency.svg"
            alt="Agency"
            className="absolute"
            style={{
              left: "32.1%",
              top: "36%",
              width: "35.7%",
            }}
          />

          <img
            src="/WireframeSphere.svg"
            alt=""
            aria-hidden="true"
            className="absolute"
            style={{
              left: "14.6%",
              top: "36.6%",
              width: "14.3%",
            }}
          />

          <img
            ref={logo1Ref}
            src="/Logo.svg"
            alt=""
            aria-hidden="true"
            className="absolute"
            style={{
              left: "65%",
              top: "38.5%",
              width: "13.4%",
            }}
          />

          <img
            ref={logo2Ref}
            src="/fxd-logo-2.png"
            alt=""
            aria-hidden="true"
            className="absolute opacity-0"
            style={{
              left: "65%",
              top: "38.5%",
              width: "13.4%",
            }}
          />

        </div>
      </div>
    </section>
  );
}