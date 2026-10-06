"use client";

import { useEffect, type RefObject } from "react";

export const EMBED_MESSAGE_SOURCE = "malla-utn-electrica";

/**
 * Inside an iframe, tells the parent page how tall the content is so it can resize the frame:
 * `{ source: "malla-utn-electrica", type: "resize", height }`.
 */
export function useEmbedResize(
  enabled: boolean,
  target: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const element = target.current;
    if (!enabled || !element || window.parent === window) return;
    const post = () =>
      window.parent.postMessage(
        {
          source: EMBED_MESSAGE_SOURCE,
          type: "resize",
          height: Math.ceil(element.getBoundingClientRect().height),
        },
        "*", // the height is not sensitive, and the embedding origin is not known in advance
      );
    const observer = new ResizeObserver(post);
    observer.observe(element);
    post();
    return () => observer.disconnect();
  }, [enabled, target]);
}
