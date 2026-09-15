import type { AcceptError } from "#discovery/types.ts";

import type { NamesResponse } from "../../../schemas/names-response.ts";

const RAW_PATTERNS = [/_/, /^wf-/i, /[-_]\d+$/];

function looksRaw(label: string): boolean {
  return RAW_PATTERNS.some((pattern) => pattern.test(label));
}

function rawIdentifierError(where: string, label: string): AcceptError {
  return {
    code: "RAW_IDENTIFIER",
    where,
    detail: `"${label}" is still the source attribute, not a human name`,
    fix: 'Write the name a person filling this form in would recognise, e.g. "Email address", "Contact enquiry".',
  };
}

interface ValidateArgs {
  response: NamesResponse;
  forms: { fieldCount: number }[];
}

export function validateNamesResponse(args: ValidateArgs): AcceptError[] {
  const errors: AcceptError[] = [];
  const seenForms = new Set<number>();

  for (const form of args.response.forms) {
    const source = args.forms[form.index];

    if (source === undefined) {
      errors.push({
        code: "UNKNOWN_FORM",
        where: `forms[${form.index}]`,
        detail: `there is no form with index ${form.index}`,
        fix: `Use only the indices the subject printed: 0 to ${args.forms.length - 1}.`,
      });
      continue;
    }

    if (seenForms.has(form.index)) {
      errors.push({
        code: "DUPLICATE_FORM",
        where: `forms[${form.index}]`,
        detail: `form ${form.index} is labelled more than once`,
        fix: "Label every form exactly once.",
      });
    }
    seenForms.add(form.index);

    if (looksRaw(form.label)) errors.push(rawIdentifierError(`forms[${form.index}].label`, form.label));

    const seenFields = new Set<number>();
    for (const field of form.fields) {
      if (field.index >= source.fieldCount) {
        errors.push({
          code: "UNKNOWN_FIELD",
          where: `forms[${form.index}].fields[${field.index}]`,
          detail: `form ${form.index} has ${source.fieldCount} fields, so there is no field ${field.index}`,
          fix: `Use indices 0 to ${source.fieldCount - 1}.`,
        });
        continue;
      }

      if (seenFields.has(field.index)) {
        errors.push({
          code: "DUPLICATE_FIELD",
          where: `forms[${form.index}].fields[${field.index}]`,
          detail: `field ${field.index} is labelled more than once`,
          fix: "Label every field exactly once.",
        });
      }
      seenFields.add(field.index);

      if (looksRaw(field.label)) {
        errors.push(rawIdentifierError(`forms[${form.index}].fields[${field.index}].label`, field.label));
      }
    }

    for (let index = 0; index < source.fieldCount; index += 1) {
      if (seenFields.has(index)) continue;
      errors.push({
        code: "MISSING_FIELD",
        where: `forms[${form.index}].fields[${index}]`,
        detail: `field ${index} has no label`,
        fix: "Label every field the subject printed.",
      });
    }
  }

  for (let index = 0; index < args.forms.length; index += 1) {
    if (seenForms.has(index)) continue;
    errors.push({
      code: "MISSING_FORM",
      where: `forms[${index}]`,
      detail: `form ${index} has no label`,
      fix: "Label every form the subject printed.",
    });
  }

  return errors;
}
