"use client";

import { useEffect, useRef, useState } from "react";

type RoomKey = "experiment" | "archive";

type Room = {
  key: RoomKey;
  mark: string;
  title: string;
  text: string;
  icon: string;
};

// 見取り図画像上の座標。画像は元画像(1672x941)から建物が中央に来るよう
// (340,80)-(1672,941) でクロップ済みのため、viewBox も同じ領域を指す。
// 順路は 入口 → 通路 → 分岐 → 各部屋
const ROUTE_TRUNK = "M 998 812 C 994 762 952 706 940 648 C 930 600 936 535 970 495";
const ROUTE_TO_ROOM1 = "M 970 495 C 890 470 810 462 745 452 L 706 447";
const ROUTE_TO_ROOM2 = "M 970 495 C 1055 472 1140 464 1215 452 L 1256 446";

export function AboutGuideMap({ mapSrc, rooms }: { mapSrc: string; rooms: readonly Room[] }) {
  const figureRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [activeRoom, setActiveRoom] = useState<RoomKey | null>(null);

  useEffect(() => {
    const el = figureRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <figure ref={figureRef} className={`about-booklet__figure${inView ? " is-inview" : ""}`}>
        <div className="about-booklet__map">
          <img src={mapSrc} alt="よこぼのAIラボの見取り図。左に実験室、右に資料室が描かれている。" />
          <svg viewBox="340 80 1332 861" aria-hidden="true" data-room={activeRoom ?? undefined}>
            <defs>
              <filter id="bk-map-soft" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="34" />
              </filter>
              <mask id="bk-map-spot-experiment">
                <rect width="1672" height="941" fill="#fff" />
                <ellipse cx="672" cy="400" rx="300" ry="255" fill="#000" filter="url(#bk-map-soft)" />
              </mask>
              <mask id="bk-map-spot-archive">
                <rect width="1672" height="941" fill="#fff" />
                <ellipse cx="1330" cy="395" rx="285" ry="240" fill="#000" filter="url(#bk-map-soft)" />
              </mask>
              <mask id="bk-map-route-reveal">
                <path className="bk-route-reveal bk-route-reveal--trunk" d={ROUTE_TRUNK} pathLength={1} />
                <path className="bk-route-reveal bk-route-reveal--branch" d={ROUTE_TO_ROOM1} pathLength={1} />
                <path className="bk-route-reveal bk-route-reveal--branch" d={ROUTE_TO_ROOM2} pathLength={1} />
              </mask>
            </defs>

            <rect className="bk-map-veil bk-map-veil--experiment" width="1672" height="941" mask="url(#bk-map-spot-experiment)" />
            <rect className="bk-map-veil bk-map-veil--archive" width="1672" height="941" mask="url(#bk-map-spot-archive)" />

            <g className="bk-map-route" mask="url(#bk-map-route-reveal)">
              {[ROUTE_TRUNK, ROUTE_TO_ROOM1, ROUTE_TO_ROOM2].map((d) => (
                <g key={d}>
                  <path className="bk-map-route__halo" d={d} />
                  <path className="bk-map-route__dots" d={d} />
                </g>
              ))}
            </g>

            <g className="bk-map-marker bk-map-marker--start">
              <circle cx="998" cy="820" r="10" />
              <text x="1034" y="820">入口</text>
            </g>
            <g className="bk-map-marker bk-map-marker--room bk-map-marker--one">
              <circle cx="652" cy="441" r="27" />
              <text x="652" y="441" textAnchor="middle">1</text>
            </g>
            <g className="bk-map-marker bk-map-marker--room bk-map-marker--two">
              <circle cx="1306" cy="436" r="27" />
              <text x="1306" y="436" textAnchor="middle">2</text>
            </g>
          </svg>
        </div>
        <figcaption>
          図1｜よこぼのAIラボ 見取り図<small>（下の凡例にふれると、部屋をご案内します）</small>
        </figcaption>
      </figure>
      <dl className="about-booklet__legend">
        {rooms.map((room) => (
          <div
            key={room.key}
            className={activeRoom === room.key ? "is-active" : undefined}
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse") setActiveRoom(room.key);
            }}
            onPointerLeave={(event) => {
              if (event.pointerType === "mouse") setActiveRoom(null);
            }}
            onPointerDown={(event) => {
              if (event.pointerType !== "mouse") {
                setActiveRoom((current) => (current === room.key ? null : room.key));
              }
            }}
          >
            <img src={room.icon} alt="" aria-hidden="true" />
            <dt>
              <small>{room.mark}</small>
              {room.title}
            </dt>
            <dd>{room.text}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
