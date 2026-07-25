// Canonical route map for the current public site.
// Retired routes (/experience, /logs, /posts*) still exist as legacy code,
// but new navigation and features must use the routes below.
export const routes = {
  home: "/",
  experiments: "/experiments",
  experimentsExplore: "/experiments/explore",
  read: "/read",
  history: "/history",
  about: "/about",
  readArticle(slug: string) {
    return `/read/${encodeURIComponent(slug)}`;
  },
  readExperimentFilter(experimentId: string) {
    return `/read?experiment=${encodeURIComponent(experimentId)}`;
  },
  experimentDetail(slug: string) {
    return `/experiments/${slug}`; // Reserved; individual detail routes are not implemented yet.
  },
  experimentAnchor(dest: string) {
    return `/experiments#${encodeURIComponent(dest)}`;
  },
} as const;

export const externalRoutes = {
  contact:
    "https://docs.google.com/forms/d/e/1FAIpQLScgKOrGgMR1S_TlSgRCCjsGQVZpK1PjqJvrX3E2ZdnpjqGC2w/viewform?usp=dialog",
  podcast: "https://open.spotify.com/show/033vTuXONCeGCsiffRWoNM",
  note: "https://note.com/ykv_yocovooo",
  x: "https://x.com/yokobo_ai",
} as const;

export const plannedRoutes = {
  podcast: "/podcast",
  tags: "/tags", // Future: generate a tag index from article/log tags.
  randomTransfer: "/random",
} as const;
