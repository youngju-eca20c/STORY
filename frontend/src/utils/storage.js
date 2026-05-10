import { createSeedWorkspace, ensureProjectShape, makeId, requiredBoardColumns } from "./normalize.js";

const STORAGE_KEY = "story-200-workspace-v1";
const LEGACY_BOARD_KEY = "story-200-board-v2";

function isBrowser() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function stampWorkspace(workspace) {
  return {
    ...workspace,
    updatedAt: new Date().toISOString()
  };
}

function migrateLegacyBoardData(workspace) {
  if (!isBrowser()) return workspace;

  const legacy = safeParse(window.localStorage.getItem(LEGACY_BOARD_KEY));
  if (!legacy || typeof legacy !== "object") return workspace;

  const migratedProjects = workspace.projects.map((project) => {
    const legacyProjectBoard = legacy[project.id];
    if (!legacyProjectBoard || typeof legacyProjectBoard !== "object") return project;

    const boardColumns = requiredBoardColumns.map((column) => {
      const existing = project.boardColumns.find((item) => item.id === column.id) ?? { id: column.id, title: column.title, cards: [] };
      const legacyCards = legacyProjectBoard[column.id] ?? [];
      const migratedCards = legacyCards.map((text, index) => ({
        id: makeId("board", `${project.id}-${column.id}-legacy-${index}`),
        text,
        tags: ["이전 메모"],
        episodeNumber: "",
        memo: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      return {
        ...existing,
        cards: [...existing.cards, ...migratedCards]
      };
    });

    return { ...project, boardColumns };
  });

  window.localStorage.removeItem(LEGACY_BOARD_KEY);

  return { ...workspace, projects: migratedProjects };
}

export function loadWorkspaceData() {
  if (!isBrowser()) {
    return createSeedWorkspace();
  }

  const saved = safeParse(window.localStorage.getItem(STORAGE_KEY));

  if (saved?.projects?.length) {
    return {
      ...saved,
      projects: saved.projects.map(ensureProjectShape)
    };
  }

  const seedWorkspace = migrateLegacyBoardData(createSeedWorkspace());
  saveWorkspaceData(seedWorkspace);

  return seedWorkspace;
}

export function saveWorkspaceData(workspace) {
  const stamped = stampWorkspace(workspace);

  if (isBrowser()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stamped));
  }

  return stamped;
}

export function resetWorkspaceData() {
  const seed = createSeedWorkspace();
  saveWorkspaceData(seed);

  return seed;
}

export function exportWorkspaceData(workspace, projectId) {
  const project = workspace.projects.find((item) => item.id === projectId);

  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      app: "STORY 200",
      project
    },
    null,
    2
  );
}

export function importWorkspaceData(workspace, imported) {
  const parsed = typeof imported === "string" ? safeParse(imported) : imported;
  const importedProject = parsed?.project ?? parsed;

  if (!importedProject?.id) {
    throw new Error("가져올 JSON 안에 project.id가 없습니다.");
  }

  const shapedProject = ensureProjectShape(importedProject);
  const exists = workspace.projects.some((project) => project.id === shapedProject.id);
  const nextWorkspace = {
    ...workspace,
    projects: exists
      ? workspace.projects.map((project) => (project.id === shapedProject.id ? shapedProject : project))
      : [...workspace.projects, shapedProject]
  };

  return saveWorkspaceData(nextWorkspace);
}

export function downloadJson(filename, content) {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
