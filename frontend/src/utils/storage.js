import { makeId, requiredBoardColumns } from "./normalize.js";

const BOARD_STORAGE_KEY = "story-200-board-notes-v1";

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

function normalizeBoardColumns(columns = []) {
  const byId = new Map(columns.map((column) => [column.id, column]));
  const byTitle = new Map(columns.map((column) => [column.title, column]));

  return requiredBoardColumns.map((required) => {
    const original = byId.get(required.id) ?? byTitle.get(required.title) ?? { cards: [] };

    return {
      id: required.id,
      title: required.title,
      cards: (original.cards ?? []).map((card, index) => {
        if (typeof card === "object") {
          return {
            id: card.id ?? makeId("board", `${required.id}-${index}`),
            text: card.text ?? "",
            tags: card.tags ?? [],
            episodeNumber: card.episodeNumber ?? "",
            memo: card.memo ?? "",
            createdAt: card.createdAt ?? new Date().toISOString(),
            updatedAt: card.updatedAt ?? new Date().toISOString()
          };
        }

        return {
          id: makeId("board", `${required.id}-${index}`),
          text: String(card),
          tags: [],
          episodeNumber: "",
          memo: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      })
    };
  });
}

function readStore() {
  if (!isBrowser()) return {};
  return safeParse(window.localStorage.getItem(BOARD_STORAGE_KEY)) ?? {};
}

function writeStore(store) {
  if (!isBrowser()) return;
  window.localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(store));
}

export function loadBoardColumns(projectId, seedColumns = []) {
  const store = readStore();
  return normalizeBoardColumns(store[projectId] ?? seedColumns);
}

export function saveBoardColumns(projectId, columns) {
  const store = readStore();
  const normalized = normalizeBoardColumns(columns);
  writeStore({ ...store, [projectId]: normalized });
  return normalized;
}
