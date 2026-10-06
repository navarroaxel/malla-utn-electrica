import type { Subject } from "@/data/schema";

export const SITE_TITLE = "Ingeniería en Energía Eléctrica · UTN FRBA";
const MAX_DESCRIPTION = 160;

function clip(text: string): string {
  if (text.length <= MAX_DESCRIPTION) return text;
  const cut = text.slice(0, MAX_DESCRIPTION - 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

/**
 * Search/social metadata of a subject page, in Spanish (the language of the static HTML).
 * Uses the profile summary when there is one; otherwise states only what the plan says.
 */
export function subjectMetadata(subject: Subject): {
  title: string;
  description: string;
} {
  const summary = subject.profile.summary.es.trim();
  const fallback = `${subject.name.es}: materia ${subject.number} de nivel ${subject.level} de la carrera de Ingeniería en Energía Eléctrica (UTN FRBA, Plan 2023). Correlatividades, qué habilita y qué aporta al perfil del graduado.`;
  return {
    title: `${subject.name.es} · ${SITE_TITLE}`,
    description: clip(summary || fallback),
  };
}

/** schema.org `Course` for a subject page, with only what the plan states. */
export function subjectJsonLd(
  subject: Subject,
  url: string,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: subject.name.es,
    courseCode: String(subject.number),
    description: subjectMetadata(subject).description,
    inLanguage: "es-AR",
    url,
    provider: {
      "@type": "CollegeOrUniversity",
      name: "Universidad Tecnológica Nacional, Facultad Regional Buenos Aires",
    },
  };
}

/** JSON for an inline `<script type="application/ld+json">` (a `<` could close the tag early). */
export function jsonLdScript(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
