import { appMeta, storyDatasets, storyProjects } from "../data/storyData.js";
import { sampleForeshadows } from "../data/sampleForeshadows.js";

export const episodeStatuses = ["미기획", "기획중", "초안완료", "수정중", "완료"];

export const episodeTags = [
  "도입",
  "코미디",
  "전투",
  "감정",
  "세계관",
  "떡밥 제시",
  "떡밥 회수",
  "캐릭터 성장",
  "빌런 등장",
  "반전",
  "쉬어가는 회차",
  "클라이맥스",
  "전환점"
];

export const foreshadowStatuses = ["미회수", "부분 회수", "완전 회수", "폐기"];
export const characterImportance = ["주연", "조연", "단역", "빌런", "조력자"];
export const characterStatuses = ["생존", "사망", "실종", "배신", "봉인", "퇴장", "미정"];
export const relationshipTypes = ["동료", "상관", "부하", "적", "가족", "은인", "라이벌", "배신 관계", "애증", "미정"];
export const timelineTypes = ["세계관", "회차진행", "캐릭터과거", "세력사건"];
export const worldCategories = ["지역", "국가", "종족", "조직", "마법", "경제", "역사", "지명", "법칙", "종교", "전쟁", "물건"];

export const requiredBoardColumns = [
  { id: "must-decide", title: "결정 필요" },
  { id: "worldbuilding", title: "세계관 보강" },
  { id: "character", title: "인물 아크" },
  { id: "foreshadow", title: "떡밥/회수" },
  { id: "risk", title: "주의할 리스크" },
  { id: "idea", title: "아이디어 보관함" }
];

const now = () => new Date().toISOString();

export function makeId(prefix, seed = "") {
  const cleaned = String(seed)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = cleaned || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  return `${prefix}-${suffix}`;
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function findEntityIdsByText(entities, text) {
  const source = String(text ?? "");

  return entities.filter((entity) => source.includes(entity.name)).map((entity) => entity.id);
}

function inferEpisodeStatus(episode) {
  if (episode.status?.includes("기존")) {
    return "기획중";
  }

  if (episode.status?.includes("완료")) {
    return "초안완료";
  }

  return "미기획";
}

function inferEpisodeTags(episode) {
  const text = [episode.title, episode.arcTitle, episode.act, episode.purpose, episode.focus].join(" ");
  const tags = [];

  if (episode.episode <= 3 || text.includes("도입") || text.includes("첫")) tags.push("도입");
  if (text.includes("개그") || text.includes("회계") || text.includes("환불") || text.includes("영수증")) tags.push("코미디");
  if (text.includes("전투") || text.includes("전쟁") || text.includes("침공") || text.includes("공성")) tags.push("전투");
  if (text.includes("감정") || text.includes("상처") || text.includes("고백") || text.includes("기억")) tags.push("감정");
  if (text.includes("세계") || text.includes("성역") || text.includes("마법") || text.includes("계약")) tags.push("세계관");
  if (text.includes("비밀") || text.includes("단서") || text.includes("첫 조각") || text.includes("장부")) tags.push("떡밥 제시");
  if (text.includes("회수") || text.includes("밝혀") || text.includes("완전한") || text.includes("최종")) tags.push("떡밥 회수");
  if (text.includes("성장") || text.includes("선택") || text.includes("권리")) tags.push("캐릭터 성장");
  if (text.includes("빌런") || text.includes("적") || text.includes("악역") || text.includes("신성 회계원")) tags.push("빌런 등장");
  if (text.includes("반전") || text.includes("배신") || text.includes("뒤집")) tags.push("반전");
  if (text.includes("휴전") || text.includes("축제") || text.includes("음식")) tags.push("쉬어가는 회차");
  if (text.includes("클라이맥스") || text.includes("최종") || text.includes("결전")) tags.push("클라이맥스");
  if (episode.episode % 20 === 0 || episode.episode % 8 === 0) tags.push("전환점");

  return uniq(tags.length ? tags : ["도입"]);
}

function inferImportance(character) {
  const text = [character.role, character.status, ...(character.tags ?? [])].join(" ");

  if (text.includes("주인공") || text.includes("주역")) return "주연";
  if (text.includes("적대") || text.includes("빌런") || text.includes("적")) return "빌런";
  if (text.includes("조력") || text.includes("동료") || text.includes("상사")) return "조력자";
  if (text.includes("과거") || text.includes("단역")) return "단역";

  return "조연";
}

function inferTimelineType(item) {
  const text = [item.era, item.event, item.impact].join(" ");

  if (text.includes("과거") || text.includes("사망") || text.includes("누명")) return "캐릭터과거";
  if (text.includes("왕국") || text.includes("의회") || text.includes("세력") || text.includes("국가")) return "세력사건";
  if (text.includes("마법") || text.includes("세계") || text.includes("성역") || text.includes("계약")) return "세계관";

  return "회차진행";
}

function normalizeCharacterRelationships(character = {}) {
  const explicitRelations = Array.isArray(character.relationships) ? character.relationships : [];
  const relatedIds = uniq([
    ...(character.relatedCharacterIds ?? []),
    ...explicitRelations.map((relation) => relation.characterId)
  ]);

  return {
    relatedCharacterIds: relatedIds,
    relationships: relatedIds.map((characterId) => {
      const existing = explicitRelations.find((relation) => relation.characterId === characterId);
      return {
        characterId,
        type: existing?.type ?? "미정",
        memo: existing?.memo ?? ""
      };
    })
  };
}

function normalizeCharacters(characters = []) {
  return characters.map((character, index) => {
    const spec = character.spec ?? {};
    const relationships = normalizeCharacterRelationships(character);
    const colors = spec.colors ?? "";

    return {
      id: character.id ?? makeId("char", character.name || index),
      name: character.name ?? `인물 ${index + 1}`,
      alias: character.alias ?? "",
      role: character.role ?? "",
      importance: character.importance ?? inferImportance(character),
      status: characterStatuses.includes(character.status) ? character.status : character.status || "생존",
      avatarDataUrl: character.avatarDataUrl ?? "",
      avatarPrompt: character.avatarPrompt ?? "",
      firstEpisode: character.firstEpisode ?? "",
      lastEpisode: character.lastEpisode ?? "",
      age: character.age ?? spec.age ?? "",
      gender: character.gender ?? "",
      species: character.species ?? "",
      affiliation: character.affiliation ?? "",
      job: character.job ?? "",
      appearanceSummary: character.appearanceSummary ?? spec.appearance ?? "",
      height: character.height ?? spec.height ?? "",
      bodyType: character.bodyType ?? "",
      hair: character.hair ?? colors,
      eyes: character.eyes ?? colors,
      outfit: character.outfit ?? "",
      firstImpression: character.firstImpression ?? "",
      symbolMotif: character.symbolMotif ?? "",
      visualKeywords: character.visualKeywords ?? [],
      personality: character.personality ?? "",
      speechStyle: character.speechStyle ?? "",
      catchphrase: character.catchphrase ?? "",
      desire: character.desire ?? "",
      fear: character.fear ?? "",
      weakness: character.weakness ?? "",
      wound: character.wound ?? "",
      secret: character.secret ?? "",
      contradiction: character.contradiction ?? "",
      value: character.value ?? "",
      characterArc: character.characterArc ?? character.arc ?? "",
      startState: character.startState ?? "",
      endState: character.endState ?? "",
      growthTrigger: character.growthTrigger ?? "",
      keyChoice: character.keyChoice ?? "",
      narrativeFunction: character.narrativeFunction ?? character.power ?? "",
      readerImpression: character.readerImpression ?? "",
      relationshipNotes: character.relationshipNotes ?? "",
      relatedCharacterIds: relationships.relatedCharacterIds,
      relationships: relationships.relationships,
      relatedFactionIds: character.relatedFactionIds ?? [],
      relatedForeshadowIds: character.relatedForeshadowIds ?? [],
      relatedWorldItemIds: character.relatedWorldItemIds ?? [],
      tags: character.tags ?? [],
      memo: character.memo ?? "",
      createdAt: character.createdAt ?? now(),
      updatedAt: character.updatedAt ?? now(),
      spec,
      power: character.power ?? "",
      arc: character.arc ?? character.characterArc ?? ""
    };
  });
}

function normalizeFactions(factions = [], characters = []) {
  return factions.map((faction, index) => {
    const text = [faction.name, faction.goal, faction.conflict, faction.use].join(" ");

    return {
      id: makeId("faction", faction.name || index),
      name: faction.name ?? `세력 ${index + 1}`,
      type: faction.type ?? "",
      goal: faction.goal ?? "",
      conflictPoint: faction.conflictPoint ?? faction.conflict ?? "",
      narrativeUse: faction.narrativeUse ?? faction.use ?? "",
      relatedCharacterIds: faction.relatedCharacterIds ?? findEntityIdsByText(characters, text),
      relatedEpisodeIds: faction.relatedEpisodeIds ?? [],
      status: faction.status ?? "활성",
      memo: faction.memo ?? "",
      updatedAt: faction.updatedAt ?? now()
    };
  });
}

function normalizeWorldItems(dataset = {}, characters = [], factions = []) {
  const locationItems = (dataset.locations ?? []).map((location, index) => {
    const text = [location.name, location.category, location.note].join(" ");

    return {
      id: makeId("world", location.name || `location-${index}`),
      name: location.name ?? `지역 ${index + 1}`,
      category: location.category ?? "지역",
      type: "지역",
      description: location.note ?? "",
      narrativeUse: location.narrativeUse ?? location.note ?? "",
      rule: "",
      cost: "",
      caution: "",
      relatedEpisodeIds: [],
      relatedCharacterIds: findEntityIdsByText(characters, text),
      relatedFactionIds: findEntityIdsByText(factions, text),
      firstMentionEpisode: "",
      memo: "",
      updatedAt: now()
    };
  });

  const magicItems = (dataset.magicSystems ?? []).map((system, index) => {
    const text = [system.name, system.rule, system.cost, system.storyUse].join(" ");

    return {
      id: makeId("world", system.name || `rule-${index}`),
      name: system.name ?? `규칙 ${index + 1}`,
      category: system.category ?? "마법",
      type: "규칙",
      description: system.rule ?? "",
      narrativeUse: system.storyUse ?? "",
      rule: system.rule ?? "",
      cost: system.cost ?? "",
      caution: system.caution ?? "",
      relatedEpisodeIds: [],
      relatedCharacterIds: findEntityIdsByText(characters, text),
      relatedFactionIds: findEntityIdsByText(factions, text),
      firstMentionEpisode: "",
      memo: "",
      updatedAt: now()
    };
  });

  return [...locationItems, ...magicItems];
}

function normalizeArcs(arcs = []) {
  return arcs.map((arc, index) => ({
    id: arc.id ?? makeId("arc", arc.title || index),
    range: arc.range ?? "",
    title: arc.title ?? `아크 ${index + 1}`,
    act: arc.act ?? "",
    summary: arc.summary ?? "",
    question: arc.question ?? "",
    episodeTitles: arc.episodeTitles ?? []
  }));
}

function normalizeEpisodes(episodes = [], arcs = [], characters = [], factions = [], worldItems = [], foreshadows = []) {
  return episodes.map((episode, index) => {
    const number = episode.number ?? episode.episode ?? index + 1;
    const arc = arcs.find((item) => item.id === episode.arcId || item.title === episode.arcTitle);
    const text = [episode.title, episode.arcTitle, episode.act, episode.purpose, episode.focus].join(" ");

    return {
      id: episode.id ?? makeId("episode", String(number).padStart(3, "0")),
      number,
      title: episode.title ?? `${number}화`,
      arc: episode.arc ?? episode.arcTitle ?? arc?.title ?? "",
      arcId: episode.arcId ?? arc?.id ?? "",
      part: episode.part ?? episode.act ?? arc?.act ?? "",
      purpose: episode.purpose ?? "",
      focus: episode.focus ?? "",
      sourceType: episode.sourceType ?? episode.status ?? "",
      summary: episode.summary ?? `${episode.arcTitle ?? arc?.title ?? "아크"}의 ${episode.purpose ?? "핵심"} 회차입니다.`,
      detail: episode.detail ?? "",
      status: episode.status && episodeStatuses.includes(episode.status) ? episode.status : inferEpisodeStatus(episode),
      tags: episode.tags ?? inferEpisodeTags({ ...episode, episode: number }),
      characterIds: episode.characterIds ?? findEntityIdsByText(characters, text),
      factionIds: episode.factionIds ?? findEntityIdsByText(factions, text),
      worldItemIds: episode.worldItemIds ?? findEntityIdsByText(worldItems, text),
      foreshadowIds: episode.foreshadowIds ?? findEntityIdsByText(foreshadows, text),
      hook: episode.hook ?? "",
      memo: episode.memo ?? "",
      updatedAt: episode.updatedAt ?? now()
    };
  });
}

function normalizeTimeline(timeline = [], characters = [], worldItems = []) {
  return timeline.map((item, index) => {
    const text = [item.era, item.event, item.impact, item.hook].join(" ");

    return {
      id: item.id ?? makeId("timeline", `${index + 1}-${item.era}`),
      timeLabel: item.timeLabel ?? item.era ?? "",
      event: item.event ?? "",
      impact: item.impact ?? "",
      hook: item.hook ?? "",
      type: item.type ?? inferTimelineType(item),
      relatedEpisodeIds: item.relatedEpisodeIds ?? [],
      relatedCharacterIds: item.relatedCharacterIds ?? findEntityIdsByText(characters, text),
      relatedWorldItemIds: item.relatedWorldItemIds ?? findEntityIdsByText(worldItems, text),
      updatedAt: item.updatedAt ?? now()
    };
  });
}

function normalizeForeshadows(storyId, characters = [], factions = [], worldItems = []) {
  return (sampleForeshadows[storyId] ?? []).map((item, index) => {
    const text = [item.title, item.description, item.memo].join(" ");

    return {
      id: makeId("foreshadow", item.title || index),
      title: item.title,
      description: item.description ?? "",
      introducedEpisode: item.introducedEpisode ?? "",
      reinforcedEpisodes: item.reinforcedEpisodes ?? [],
      partialPayoffEpisode: item.partialPayoffEpisode ?? "",
      fullPayoffEpisode: item.fullPayoffEpisode ?? "",
      status: item.status ?? "미회수",
      relatedCharacterIds: item.relatedCharacterIds ?? findEntityIdsByText(characters, text),
      relatedFactionIds: item.relatedFactionIds ?? findEntityIdsByText(factions, text),
      relatedWorldItemIds: item.relatedWorldItemIds ?? findEntityIdsByText(worldItems, text),
      memo: item.memo ?? "",
      lastMentionEpisode: item.lastMentionEpisode ?? Math.max(
        Number(item.introducedEpisode) || 0,
        ...(item.reinforcedEpisodes ?? []).map((episode) => Number(episode) || 0),
        Number(item.partialPayoffEpisode) || 0,
        Number(item.fullPayoffEpisode) || 0
      ),
      updatedAt: now()
    };
  });
}

function normalizeBoardColumns(columns = []) {
  const byTitle = new Map(columns.map((column) => [column.title, column]));

  return requiredBoardColumns.map((required) => {
    const original = columns.find((column) => column.id === required.id) ?? byTitle.get(required.title);

    return {
      id: required.id,
      title: required.title,
      cards: (original?.cards ?? []).map((card, index) => {
        if (typeof card === "object") {
          return {
            id: card.id ?? makeId("board", `${required.id}-${index}`),
            text: card.text ?? "",
            tags: card.tags ?? [],
            episodeNumber: card.episodeNumber ?? "",
            memo: card.memo ?? "",
            createdAt: card.createdAt ?? now(),
            updatedAt: card.updatedAt ?? now()
          };
        }

        return {
          id: makeId("board", `${required.id}-${index}-${card}`),
          text: card,
          tags: [],
          episodeNumber: "",
          memo: "",
          createdAt: now(),
          updatedAt: now()
        };
      })
    };
  });
}

function normalizeSourceFiles(sourceFiles = []) {
  return sourceFiles.map((source, index) => ({
    id: source.id ?? makeId("source", source.file || source.title || index),
    title: source.title ?? "",
    file: source.file ?? "",
    role: source.role ?? "",
    phases: source.phases ?? 0,
    note: source.note ?? "",
    relatedArcIds: source.relatedArcIds ?? [],
    updatedAt: source.updatedAt ?? now()
  }));
}

export function normalizeProject(story, dataset = {}) {
  const characters = normalizeCharacters(dataset.characters);
  const arcs = normalizeArcs(dataset.storyArcs);
  const factions = normalizeFactions(dataset.factions, characters);
  const worldItems = normalizeWorldItems(dataset, characters, factions);
  const foreshadows = normalizeForeshadows(story.id, characters, factions, worldItems);
  const episodes = normalizeEpisodes(dataset.episodeRoadmap, arcs, characters, factions, worldItems, foreshadows);

  return {
    id: story.id,
    meta: { ...story },
    sourceFiles: normalizeSourceFiles(dataset.sourceFiles),
    storySpine: dataset.storySpine ?? [],
    themes: dataset.themes ?? [],
    arcs,
    episodes,
    characters,
    factions,
    worldItems,
    timeline: normalizeTimeline(dataset.timeline, characters, worldItems),
    foreshadows,
    boardColumns: normalizeBoardColumns(dataset.boardColumns),
    dailyMemo: "",
    updatedAt: now()
  };
}

export function createSeedWorkspace() {
  return {
    version: 1,
    appMeta,
    projects: storyProjects
      .filter((story) => !story.disabled)
      .map((story) => normalizeProject(story, storyDatasets[story.id] ?? {})),
    storyProjects,
    createdAt: now(),
    updatedAt: now()
  };
}

export function ensureProjectShape(project) {
  const seedProject = createSeedWorkspace().projects.find((item) => item.id === project?.id);

  return {
    ...seedProject,
    ...project,
    meta: { ...(seedProject?.meta ?? {}), ...(project?.meta ?? {}) },
    sourceFiles: project?.sourceFiles ?? seedProject?.sourceFiles ?? [],
    storySpine: project?.storySpine ?? seedProject?.storySpine ?? [],
    themes: project?.themes ?? seedProject?.themes ?? [],
    arcs: project?.arcs ?? seedProject?.arcs ?? [],
    episodes: project?.episodes ?? seedProject?.episodes ?? [],
    characters: normalizeCharacters(project?.characters ?? seedProject?.characters ?? []),
    factions: project?.factions ?? seedProject?.factions ?? [],
    worldItems: project?.worldItems ?? seedProject?.worldItems ?? [],
    timeline: project?.timeline ?? seedProject?.timeline ?? [],
    foreshadows: project?.foreshadows ?? seedProject?.foreshadows ?? [],
    boardColumns: normalizeBoardColumns(project?.boardColumns ?? seedProject?.boardColumns ?? []),
    dailyMemo: project?.dailyMemo ?? ""
  };
}
