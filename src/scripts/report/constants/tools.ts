export interface ToolLink {
  target: string;
  repo: string;
  url: string;
}

export const TOOLS_BY_SOURCE: Record<"webflow" | "framer", ToolLink[]> = {
  webflow: [
    { target: "Sanity", repo: "webflow-to-sanity-migration", url: "https://github.com/focusreactive/webflow-to-sanity-migration" },
    { target: "Payload", repo: "webflow-to-payload-migration", url: "https://github.com/focusreactive/webflow-to-payload-migration" },
  ],
  framer: [
    { target: "Sanity", repo: "framer-to-sanity-migration", url: "https://github.com/focusreactive/framer-to-sanity-migration" },
    { target: "Payload", repo: "framer-to-payload-migration", url: "https://github.com/focusreactive/framer-to-payload-migration" },
  ],
};

export const CONSULTATION_URL = "https://focusreactive.com/services/headless-cms-expert-agency/#contacts";
export const CONTACT_EMAIL = "build@focusreactive.com";
