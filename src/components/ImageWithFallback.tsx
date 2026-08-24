"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
}

export default function ImageWithFallback({
  src,
  alt,
  className = "",
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`bg-vertbrume-100 flex flex-col items-center justify-center gap-2 ${className}`}
      >
        <ImageIcon className="w-8 h-8 text-charbon-200" />
        <span className="text-xs text-charbon-200">Image non disponible</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`object-cover ${className}`}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
}
