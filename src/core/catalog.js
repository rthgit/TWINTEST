import { operatingModeCatalog, scenarioProfiles, templateLibrary } from "./catalog-base.js";
import { domainBlueprintsA } from "./blueprints-a.js";
import { domainBlueprintsB } from "./blueprints-b.js";

export { operatingModeCatalog, scenarioProfiles, templateLibrary };

export const domainBlueprints = {
  ...domainBlueprintsA,
  ...domainBlueprintsB
};

export function listSupportedDomains() {
  return Object.values(domainBlueprints).map((domain) => ({
    id: domain.id,
    label: domain.label
  }));
}

export function getTemplateById(templateId) {
  return templateLibrary.find((template) => template.id === templateId);
}
