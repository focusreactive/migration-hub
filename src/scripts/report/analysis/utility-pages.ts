import { SPECIMEN_SECTION_ROLES, UTILITY_ROUTE_PREFIXES, UTILITY_ROUTE_SLUGS } from "../constants/roles.ts";

export function isUtilityRoute(route: string): boolean {
  const segments = route.split("/").filter(Boolean);
  const first = segments[0];
  const last = segments.at(-1);

  if (first !== undefined && (UTILITY_ROUTE_PREFIXES as readonly string[]).includes(first)) return true;
  return last !== undefined && (UTILITY_ROUTE_SLUGS as readonly string[]).includes(last);
}

export function isUtilitySectionType(type: { role: string; members: { route: string }[] }): boolean {
  if ((SPECIMEN_SECTION_ROLES as readonly string[]).includes(type.role)) return true;
  return type.members.every((member) => isUtilityRoute(member.route));
}
