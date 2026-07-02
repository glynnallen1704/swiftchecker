/**
 * Shared motion layer (GSAP), tuned to the Shyft DS motion rules:
 * restrained, ~120-250ms feel, soft eases, no bouncy decoration.
 * Everything respects prefers-reduced-motion.
 */
import type { RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

export { gsap, useGSAP, SplitText };

export const EASE = "power2.out";

export function reducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Rise-and-fade a set of child selectors on mount, staggered.
 * `ref` scopes the selector lookups to the component.
 */
export function useMountRise(
  ref: RefObject<HTMLElement | null>,
  targets: string,
  options: { y?: number; stagger?: number; delay?: number; duration?: number } = {},
) {
  const { y = 16, stagger = 0.05, delay = 0, duration = 0.45 } = options;
  useGSAP(
    () => {
      if (reducedMotion()) return;
      gsap.from(targets, {
        y,
        autoAlpha: 0,
        duration,
        delay,
        stagger,
        ease: EASE,
        clearProps: "all",
      });
    },
    { scope: ref },
  );
}

/**
 * Entrance choreography for a result card: card rises, then pills pop,
 * then detail rows / attached cards cascade in.
 */
export function useResultCardIntro(ref: RefObject<HTMLDivElement | null>) {
  useGSAP(
    () => {
      if (reducedMotion() || !ref.current) return;
      const tl = gsap.timeline({ defaults: { ease: EASE } });
      tl.from(ref.current, { y: 22, autoAlpha: 0, duration: 0.45, clearProps: "all" })
        .from(
          ".shyft-pill",
          { scale: 0.8, autoAlpha: 0, duration: 0.3, stagger: 0.06, clearProps: "all" },
          "-=0.2",
        )
        .from(
          ".shyft-row",
          { y: 12, autoAlpha: 0, duration: 0.35, stagger: 0.04, clearProps: "all" },
          "-=0.15",
        )
        .from(
          ".osm-card, .result-card > .shyft-callout",
          { y: 14, autoAlpha: 0, duration: 0.4, clearProps: "all" },
          "-=0.1",
        );
    },
    { scope: ref },
  );
}

/**
 * Reveal child selectors when the section scrolls into view (once).
 */
export function useScrollRise(
  ref: RefObject<HTMLElement | null>,
  targets: string,
  options: { y?: number; stagger?: number } = {},
) {
  const { y = 22, stagger = 0.08 } = options;
  useGSAP(
    () => {
      if (reducedMotion()) return;
      gsap.from(targets, {
        y,
        autoAlpha: 0,
        duration: 0.55,
        stagger,
        ease: EASE,
        clearProps: "all",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 80%",
          once: true,
        },
      });
    },
    { scope: ref },
  );
}
