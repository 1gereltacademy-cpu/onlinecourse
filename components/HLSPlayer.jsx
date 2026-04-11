
"use client";

import { useEffect, useState } from "react";

export default function HLSPlayer({ lessonId, videoPath }) {
  const [videoSrc, setVideoSrc] = useState("");
  const [playerError, setPlayerError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadVideo() {
      if (!videoPath || !lessonId) return;

      try {
        setLoading(true);
        setPlayerError("");

        const url = `/api/video-stream?path=${encodeURIComponent(
          videoPath
        )}&lessonId=${encodeURIComponent(lessonId)}`;

        setVideoSrc(url);
      } catch (e) {
        setPlayerError(e.message || "Видео тоглуулахад алдаа гарлаа");
      } finally {
        setLoading(false);
      }
    }

    loadVideo();
  }, [videoPath, lessonId]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) ||
        (e.ctrlKey && ["s", "S", "u", "U", "p", "P"].includes(e.key))
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-black/40"
      onContextMenu={(e) => e.preventDefault()}
    >
      {loading ? (
        <div className="flex aspect-video items-center justify-center text-slate-300">
          Видео ачаалж байна...
        </div>
      ) : playerError ? (
        <div className="flex aspect-video items-center justify-center text-red-300">
          {playerError}
        </div>
      ) : videoSrc ? (
        <video
          src={videoSrc}
          controls
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          className="aspect-video w-full bg-black"
        />
      ) : (
        <div className="flex aspect-video items-center justify-center text-slate-300">
          Видео олдсонгүй
        </div>
      )}
    </div>
  );
}
