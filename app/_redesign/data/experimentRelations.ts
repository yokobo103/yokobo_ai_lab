import { labExperiments } from "./labExperiments";
import type { ResearchLog } from "./researchLogs";
import { routes } from "./routes";

export function getRelatedLogSlugs(experimentId: string) {
  const experiment = labExperiments.find((item) => item.id === experimentId);
  return experiment?.relatedPostId ? [experiment.relatedPostId] : [];
}

export function getRelatedExperimentId(log: ResearchLog) {
  return labExperiments.find((experiment) => experiment.relatedPostId === log.slug)?.id ?? null;
}

export function getRelatedExperiment(log: ResearchLog) {
  const experimentId = getRelatedExperimentId(log);
  return experimentId ? (labExperiments.find((experiment) => experiment.id === experimentId) ?? null) : null;
}

export function getExperimentLogHref(experimentId: string) {
  const experiment = labExperiments.find((item) => item.id === experimentId);
  return experiment?.relatedPostId ? routes.readArticle(experiment.relatedPostId) : routes.readExperimentFilter(experimentId);
}

export function getExperimentLaunchHref(experimentId: string) {
  return routes.experimentAnchor(experimentId);
}
