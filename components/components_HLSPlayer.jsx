
"use client";

import Hls from "hls.js";
import { useEffect, useRef } from "react";

export default function HLSPlayer({ videoPath }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!videoPath) return;

    const video = videoRef.current;
    const url = `/api/video-stream?path=${videoPath}`;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
    } else {
      video.src = url;
    }
  }, [videoPath]);

  return (
    <video
      ref={videoRef}
      controls
      controlsList="nodownload nofullscreen"
      className="w-full rounded-2xl"
    />
  );
}
