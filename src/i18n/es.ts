export const es = {
  app: {
    name: "malla-utn-electrica",
    title: "Malla curricular · Ingeniería en Energía Eléctrica",
    description:
      "Mapa interactivo de correlatividades y perfil del graduado de la carrera de Ingeniería en Energía Eléctrica, UTN FRBA.",
  },
  toolbar: {
    search: "Buscar",
    searchTitle: "Buscar materia (/ o Ctrl+K)",
    view: "Vista",
    viewGraph: "Malla",
    viewList: "Lista",
    progress: "Mi progreso",
  },
  search: {
    title: "Buscar materia",
    placeholder: "Nombre o número de materia",
    results: (n: number) => (n === 1 ? "1 materia" : `${n} materias`),
    none: "No hay materias que coincidan.",
    close: "Cerrar búsqueda",
  },
  progress: {
    region: "Mi progreso",
    summaryRegion: "Resumen de mi progreso",
    summary: (passed: number, taken: number, available: number) =>
      `${passed} aprobadas · ${taken} cursadas · ${available} disponibles ahora`,
    statusLabel: "Estado de esta materia",
    status: { none: "Sin cursar", taken: "Cursada", passed: "Aprobada" },
    state: {
      available: "Disponible",
      blocked: "Bloqueada",
      taken: "Cursada",
      passed: "Aprobada",
    },
    missing: "Te falta",
    missingItem: (name: string, requirement: "taken" | "passed") =>
      `${name} (${requirement === "passed" ? "aprobada" : "cursada"})`,
    missingTitle: (items: string[]) => `Te falta: ${items.join(", ")}`,
    code: "Tu código",
    copyCode: "Copiar código",
    copyLink: "Copiar enlace",
    copied: "¡Copiado!",
    importLabel: "Importar código",
    importApply: "Aplicar",
    importInvalid: "El código no es válido para esta malla.",
    clear: "Borrar progreso",
    clearConfirm: "¿Borrar todo tu progreso?",
    incoming: "Este enlace trae un progreso guardado.",
    incomingApply: "Reemplazar el mío",
    incomingIgnore: "Ignorar",
    legendPassed: "Fondo verde y etiqueta: aprobada",
    legendTaken: "Fondo ámbar y etiqueta: cursada",
    legendBlocked: "Borde discontinuo y atenuada: te faltan correlativas",
  },
  list: {
    label: "Materias por nivel",
    caption: (level: string) => `Nivel ${level}`,
    number: "Nº",
    subject: "Materia",
    taken: "Cursadas",
    passed: "Aprobadas",
    status: "Estado",
    lens: (code: string) => `Aporte a ${code}`,
    none: "—",
  },
  page: {
    back: "Volver a la malla",
    openPage: "Abrir la página de esta materia",
    subjectsNav: "Páginas de cada materia",
  },
  notFound: {
    title: "No encontramos esta página",
    text: "El enlace puede estar mal escrito o la materia ya no existe.",
    back: "Ir a la malla",
  },
  canvas: {
    ariaLabel: "Malla curricular: materias y correlatividades",
    hint: "Hacé clic o Enter en una materia para ver su detalle. Con el teclado: ← correlativa, → materia que habilita, ↑ ↓ misma columna, Esc para salir.",
    level: (roman: string) => `Nivel ${roman}`,
    showAll: "Mostrar todas las correlativas",
    legendTitle: "Referencias",
    legendPassed: "Línea continua: tenés que tenerla aprobada",
    legendTaken: "Línea punteada: tenés que tenerla cursada",
    legendIntegrative: "Forma redonda: materia integradora",
    electiveTag: "Electiva",
    legendElective: "Etiqueta «Electiva» y abajo del mapa: materia electiva",
    nodeAria: (
      name: string,
      level: number,
      taken: string[],
      passed: string[],
    ) => {
      const parts = [`${name}, nivel ${level}`];
      if (taken.length > 0)
        parts.push(`requiere cursadas: ${taken.join(", ")}`);
      if (passed.length > 0)
        parts.push(`requiere aprobadas: ${passed.join(", ")}`);
      if (taken.length + passed.length === 0) parts.push("sin correlativas");
      return parts.join(", ");
    },
  },
  profile: {
    title: "Qué aporta a tu perfil",
    draft: "Borrador",
    draftHint: "Contenido sin validar por la cátedra ni por el departamento.",
    reviewed: "Revisado",
    reviewedBy: (who: string) => `Revisado por ${who}`,
    noSummary: "Todavía no hay un resumen para esta materia.",
    competencies: "Competencias",
    noCompetencies: "Todavía no hay competencias asignadas a esta materia.",
    activities: "Alcances del título",
    scopeLegend: "AR: actividad reservada · AL: otro alcance del título",
    noActivities:
      "Todavía no hay alcances del título vinculados a esta materia.",
    showInMap: "Ver en la malla",
    levels: {
      contributes: "Aporta",
      introduces: "Introduce",
      develops: "Desarrolla",
      consolidates: "Consolida",
    },
  },
  lens: {
    label: "Competencia",
    none: "Sin lente",
    legend: "Lente de competencia",
    empty:
      "Todavía no hay materias asignadas a esta competencia (contenido en borrador).",
    groups: {
      technological: "Genéricas · tecnológicas",
      "social-political-attitudinal":
        "Genéricas · sociales, políticas y actitudinales",
      specific: "Específicas",
    },
  },
  schedule: {
    title: "Horarios",
    reference: (year: number, plan: string, target: number) =>
      `Referencia: horarios del ciclo ${year} (${plan}). Todavía no están confirmados para ${target}.`,
    confirmed: (year: number) => `Horarios confirmados para ${year}.`,
    venue: (name: string) => `Sede: ${name}`,
    division: "Comisión",
    time: (from: string, to: string) => `${from} a ${to}`,
    timesNote:
      "Las horas salen de la tabla de horas cátedra de la UTN, válida para todas las carreras.",
    modules: (modules: string) => `módulos ${modules}`,
    moduleNote:
      "Los módulos son las franjas de la grilla del departamento (0 a 6). Si la hoja no permite saber el turno de un día, se muestran solo los módulos.",
    none: "Todavía no hay horarios cargados para esta materia.",
    shifts: { morning: "Mañana", afternoon: "Tarde", evening: "Noche" },
    modality: { annual: "Anual", semester: "Cuatrimestral" },
    days: {
      monday: "Lunes",
      tuesday: "Martes",
      wednesday: "Miércoles",
      thursday: "Jueves",
      friday: "Viernes",
      saturday: "Sábado",
    },
  },
  panel: {
    title: "Detalle de la materia",
    close: "Cerrar detalle",
    empty: "Elegí una materia para ver su detalle.",
    number: "Materia Nº",
    level: "Nivel",
    term: "Cursado",
    hours: "Horas cátedra semanales",
    totalHours: "Carga horaria total",
    clockHours: (h: number) => `${h} h reloj`,
    objectives: "Objetivos",
    contents: "Contenidos mínimos",
    syllabusNote: "Texto oficial del programa sintético (Ord. C.S. 1873).",
    block: "Bloque",
    noData: "Sin dato",
    integrative: "Materia integradora",
    prerequisites: "Correlativas",
    taken: "Tenés que tenerlas cursadas",
    passed: "Tenés que tenerlas aprobadas",
    none: "Ninguna",
    unlocks: "Materias que habilita",
    unlocksNone: "No habilita otras materias",
    unlocksTaken: "con cursada",
    unlocksPassed: "con aprobada",
    specialRule: "Condición especial",
    terms: {
      annual: "Anual",
      first: "Primer cuatrimestre",
      second: "Segundo cuatrimestre",
      either: "Cualquier cuatrimestre",
    },
    blocks: {
      "basic-sciences": "Ciencias básicas",
      "basic-technologies": "Tecnologías básicas",
      "applied-technologies": "Tecnologías aplicadas",
      complementary: "Complementarias",
    },
  },
  language: {
    label: "Idioma",
    switchTo: "Cambiar a inglés",
    es: "Español",
    en: "English",
  },
};

export type Dictionary = typeof es;
