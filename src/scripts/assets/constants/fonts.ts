export const FONT_FACE_BLOCK_PATTERN = /@font-face\s*\{([^}]*)\}/gi;

export const FONT_PROVIDER_HOSTS = new Set([
  "fonts.googleapis.com",
  "use.typekit.net",
  "fonts.bunny.net",
  "api.fontshare.com",
]);

export const DEFAULT_FONT_WEIGHT = "400";

export const DEFAULT_FONT_STYLE = "normal" as const;
