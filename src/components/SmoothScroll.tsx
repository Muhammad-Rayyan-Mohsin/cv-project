"use client";

import { ReactLenis } from "lenis/react";

export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReactLenis
      root
      options={{
        // Use lerp ONLY — duration overrides lerp when both are set.
        // Lower lerp = smoother/slower interpolation. 0.08 is ultra-fluid.
        lerp: 0.08,
        smoothWheel: true,
        wheelMultiplier: 0.9,
        // Touch: enable syncTouch for inertia-based smooth touch scrolling
        syncTouch: true,
        syncTouchLerp: 0.06,
        touchInertiaExponent: 1.2,
        touchMultiplier: 1.5,
        // Natural overscroll bounce
        overscroll: true,
        autoRaf: true,
        prevent: (node) => {
          // Skip smooth scrolling for elements with overflow scrolling
          const style = getComputedStyle(node);
          return (
            style.overflowY === "auto" ||
            style.overflowY === "scroll" ||
            style.overflow === "auto" ||
            style.overflow === "scroll" ||
            node.hasAttribute("data-lenis-prevent")
          );
        },
      }}
    >
      {children}
    </ReactLenis>
  );
}
