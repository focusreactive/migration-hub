import type { DedupResponse } from "../../../schemas/dedup-response.ts";
import type { AcceptError } from "../../../types.ts";
import type { DedupInstance } from "./fold-types.ts";

function key(member: { route: string; order: number }): string {
  return `${member.route}#${member.order}`;
}

export function validateDedupResponse(args: {
  response: DedupResponse;
  instances: DedupInstance[];
}): AcceptError[] {
  const errors: AcceptError[] = [];
  const known = new Map(args.instances.map((instance) => [key(instance), instance]));
  const claimed = new Set<string>();

  for (const [groupIndex, group] of args.response.groups.entries()) {
    for (const member of group.members) {
      const memberKey = key(member);
      const instance = known.get(memberKey);

      if (instance === undefined) {
        errors.push({
          code: "UNKNOWN_MEMBER",
          where: `groups[${groupIndex}].members`,
          got: memberKey,
          detail: "This route and order pair was never listed in the subject.",
          fix: "Only use members printed by the subject step.",
        });
        continue;
      }

      if (claimed.has(memberKey)) {
        errors.push({
          code: "DUPLICATE_MEMBER",
          where: `groups[${groupIndex}].members`,
          got: memberKey,
          detail: "This section is claimed by more than one group.",
          fix: "Put every section in exactly one group.",
        });
      }
      claimed.add(memberKey);

      if (instance.kind !== group.kind) {
        errors.push({
          code: "KIND_MISMATCH",
          where: `groups[${groupIndex}].kind`,
          got: `${group.kind} for a ${instance.kind}`,
          detail: "A global and a block can never share a group.",
          fix: "Group globals with globals and blocks with blocks.",
        });
      }
    }

    if (!group.members.some((member) => key(member) === key(group.exemplar))) {
      errors.push({
        code: "EXEMPLAR_NOT_MEMBER",
        where: `groups[${groupIndex}].exemplar`,
        got: key(group.exemplar),
        detail: "The exemplar must be one of the group's own members.",
        fix: "Pick the exemplar from the members list.",
      });
    }
  }

  for (const instance of args.instances) {
    if (!claimed.has(key(instance))) {
      errors.push({
        code: "INPUT_NOT_COVERED",
        where: "groups",
        got: key(instance),
        detail: "Every listed section must land in exactly one group.",
        fix: "Add this section to a group; a one-off section becomes a group with one member.",
      });
    }
  }

  return errors;
}
