"use client";

import { useEffect, useRef } from "react";

const MAX_RETRIES = 3;

export function useSseStream<T>(
  url: string | null,
  eventName: string,
  onData: (data: T) => void,
) {
  const onDataRef = useRef(onData);
  onDataRef.current = onData;

  useEffect(() => {
    if (!url) return;

    let source: EventSource | null = null;
    let retries = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    function connect() {
      source = new EventSource(url!);

      source.addEventListener(eventName, (event) => {
        retries = 0;
        try {
          onDataRef.current(JSON.parse((event as MessageEvent).data) as T);
        } catch {
          /* ignore parse errors */
        }
      });

      source.onerror = () => {
        source?.close();
        source = null;
        if (closed || retries >= MAX_RETRIES) return;
        retries += 1;
        retryTimer = setTimeout(connect, Math.min(1000 * 2 ** retries, 8000));
      };
    }

    connect();

    return () => {
      closed = true;
      if (retryTimer) clearTimeout(retryTimer);
      source?.close();
    };
  }, [url, eventName]);
}

export function buildSseUrl(path: string): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("bookleaf_token");
  if (!token) return null;
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const separator = path.includes("?") ? "&" : "?";
  return `${base}${path}${separator}token=${encodeURIComponent(token)}`;
}
