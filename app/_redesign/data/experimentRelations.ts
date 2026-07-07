import { labExperiments } from "./labExperiments";
import type { ResearchLog } from "./researchLogs";
import { routes } from "./routes";

function getExperimentLogSlugs(experiment: (typeof labExperiments)[number]) {
  return Array.from(new Set([...(experiment.relatedPostIds ?? []), experiment.relatedPostId].filter(Boolean) as string[]));
}

export function getRelatedLogSlugs(experimentId: string) {
  const experiment = labExperiments.find((item) => item.id === experimentId);
  return experiment ? getExperimentLogSlugs(experiment) : [];
}

export function getRelatedExperimentId(log: ResearchLog) {
  return labExperiments.find((experiment) => getExperimentLogSlugs(experiment).includes(log.slug))?.id ?? null;
}

export function getRelatedExperiment(log: ResearchLog) {
  const experimentId = getRelatedExperimentId(log);
  return experimentId ? (labExperiments.find((experiment) => experiment.id === experimentId) ?? null) : null;
}

export function getExperimentLogHref(experimentId: string) {
  const experiment = labExperiments.find((item) => item.id === experimentId);
  const logSlugs = experiment ? getExperimentLogSlugs(experiment) : [];
  return logSlugs.length === 1 ? routes.readArticle(logSlugs[0]) : routes.readExperimentFilter(experimentId);
}

export function getExperimentLaunchHref(experimentId: string) {
  return routes.experimentAnchor(experimentId);
}
