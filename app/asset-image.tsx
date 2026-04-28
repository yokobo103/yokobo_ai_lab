"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";

type AssetImageProps = {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel: string;
};

export function AssetImage({ src, alt, className, fallbackLabel }: AssetImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`assetPlaceholder ${className ?? ""}`} aria-label={alt}>
        <span>{fallbackLabel}</span>
      </div>
    );
  }

  return <img className={className} src={src} alt={alt} onError={() => setFailed(true)} />;
}
