import { SPECIMEN_SECTION_ROLES, UTILITY_ROUTE_PREFIXES, UTILITY_ROUTE_SLUGS } from "../constants/roles.ts";

export function isUtilityRoute(route: string): boolean {
  const segments = route.split("/").filter(Boolean);
  const first = segments[0];
  if (first === undefined) return false;

  if ((UTILITY_ROUTE_PREFIXES as readonly string[]).includes(first)) return true;
  return segments.length === 1 && (UTILITY_ROUTE_SLUGS as readonly string[]).includes(first);
}

export function isUtilitySectionType(type: { role: string; members: { route: string }[] }): boolean {
  if ((SPECIMEN_SECTION_ROLES as readonly string[]).includes(type.role)) return true;
  if (type.members.length === 0) return false;
  return type.members.every((member) => isUtilityRoute(member.route));
}
