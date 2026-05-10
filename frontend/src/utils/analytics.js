import { episodeStatuses } from "./normalize.js";

function maxEpisodeNumber(project) {
  return Math.max(0, ...project.episodes.map((episode) => Number(episode.number) || 0));
}

export function getEpisodeStatusCounts(project) {
  return episodeStatuses.reduce((counts, status) => {
    counts[status] = project.episodes.filter((episode) => episode.status === status).length;
    return counts;
  }, {});
}

export function getEpisodeProgress(project) {
  if (!project.episodes.length) return 0;

  const weights = {
    미기획: 0,
    기획중: 0.35,
    초안완료: 0.65,
    수정중: 0.8,
    완료: 1
  };
  const score = project.episodes.reduce((sum, episode) => sum + (weights[episode.status] ?? 0), 0);

  return Math.round((score / project.episodes.length) * 100);
}

export function getTagCounts(project) {
  return project.episodes.reduce((counts, episode) => {
    (episode.tags ?? []).forEach((tag) => {
      counts[tag] = (counts[tag] ?? 0) + 1;
    });
    return counts;
  }, {});
}

export function getCharacterAppearanceCounts(project) {
  return project.characters.map((character) => {
    const episodes = project.episodes
      .filter((episode) => episode.characterIds?.includes(character.id))
      .map((episode) => episode.number)
      .sort((a, b) => a - b);

    return {
      character,
      count: episodes.length,
      firstEpisode: episodes[0] ?? character.firstEpisode ?? "",
      lastEpisode: episodes.at(-1) ?? character.lastEpisode ?? "",
      episodes
    };
  });
}

export function getForeshadowStats(project) {
  const unresolved = project.foreshadows.filter((item) => item.status === "미회수" || item.status === "부분 회수");

  return {
    total: project.foreshadows.length,
    unresolved: unresolved.length,
    resolved: project.foreshadows.filter((item) => item.status === "완전 회수").length,
    discarded: project.foreshadows.filter((item) => item.status === "폐기").length
  };
}

export function getForeshadowLastMention(project, foreshadow) {
  const connectedEpisodes = project.episodes
    .filter((episode) => episode.foreshadowIds?.includes(foreshadow.id))
    .map((episode) => Number(episode.number) || 0);
  const directEpisodes = [
    Number(foreshadow.introducedEpisode) || 0,
    ...(foreshadow.reinforcedEpisodes ?? []).map((episode) => Number(episode) || 0),
    Number(foreshadow.partialPayoffEpisode) || 0,
    Number(foreshadow.fullPayoffEpisode) || 0,
    Number(foreshadow.lastMentionEpisode) || 0
  ];

  return Math.max(0, ...directEpisodes, ...connectedEpisodes);
}

export function getStaleForeshadows(project, threshold = 20) {
  const latestEpisode = maxEpisodeNumber(project);

  return project.foreshadows
    .filter((item) => item.status === "미회수" || item.status === "부분 회수")
    .map((item) => ({ ...item, lastMentionEpisode: getForeshadowLastMention(project, item) }))
    .filter((item) => item.lastMentionEpisode && latestEpisode - item.lastMentionEpisode >= threshold);
}

export function getInactiveMainCharacters(project, threshold = 20) {
  const latestEpisode = maxEpisodeNumber(project);

  return getCharacterAppearanceCounts(project).filter(({ character, lastEpisode }) => {
    const important = character.importance === "주연" || character.importance === "빌런";

    return important && lastEpisode && latestEpisode - lastEpisode >= threshold;
  });
}

export function getTagOveruseWarnings(project) {
  const recent = [...project.episodes].sort((a, b) => b.number - a.number).slice(0, 10);
  const counts = recent.reduce((result, episode) => {
    (episode.tags ?? []).forEach((tag) => {
      result[tag] = (result[tag] ?? 0) + 1;
    });
    return result;
  }, {});

  return Object.entries(counts)
    .filter(([, count]) => count >= 6)
    .map(([tag, count]) => ({ tag, count }));
}

export function getUnplannedEpisodeRanges(project) {
  const sorted = [...project.episodes].sort((a, b) => a.number - b.number);
  const ranges = [];
  let current = null;

  sorted.forEach((episode) => {
    if (episode.status === "미기획") {
      if (!current) current = { start: episode.number, end: episode.number, count: 1 };
      else {
        current.end = episode.number;
        current.count += 1;
      }
      return;
    }

    if (current && current.count >= 5) ranges.push(current);
    current = null;
  });

  if (current && current.count >= 5) ranges.push(current);

  return ranges;
}

export function getEmptyArcFocusWarnings(project) {
  return project.arcs
    .map((arc) => {
      const episodes = project.episodes.filter((episode) => episode.arcId === arc.id || episode.arc === arc.title);
      const hasFocus = episodes.some((episode) => episode.characterIds?.length || episode.focus);

      return { arc, episodes, hasFocus };
    })
    .filter((item) => item.episodes.length && !item.hasFocus);
}

export function getDashboardWarnings(project) {
  const warnings = [];
  const staleForeshadows = getStaleForeshadows(project);
  const inactiveCharacters = getInactiveMainCharacters(project);
  const tagWarnings = getTagOveruseWarnings(project);
  const unplannedRanges = getUnplannedEpisodeRanges(project);
  const emptyArcFocus = getEmptyArcFocusWarnings(project);

  staleForeshadows.slice(0, 4).forEach((item) => {
    warnings.push({
      id: `stale-${item.id}`,
      severity: "danger",
      title: "방치된 미회수 떡밥",
      message: `${item.title} · ${item.lastMentionEpisode}화 이후 언급이 없습니다.`
    });
  });

  inactiveCharacters.slice(0, 4).forEach(({ character, lastEpisode }) => {
    warnings.push({
      id: `inactive-${character.id}`,
      severity: "warning",
      title: "주요 캐릭터 공백",
      message: `${character.name} · ${lastEpisode}화 이후 최근 등장이 없습니다.`
    });
  });

  tagWarnings.forEach(({ tag, count }) => {
    warnings.push({
      id: `tag-${tag}`,
      severity: "info",
      title: "태그 반복 과다",
      message: `최근 10화에 '${tag}' 태그가 ${count}회 반복됩니다.`
    });
  });

  unplannedRanges.slice(0, 3).forEach((range) => {
    warnings.push({
      id: `range-${range.start}-${range.end}`,
      severity: "warning",
      title: "미기획 회차 구간",
      message: `${range.start}-${range.end}화가 연속 미기획 상태입니다.`
    });
  });

  emptyArcFocus.slice(0, 3).forEach(({ arc }) => {
    warnings.push({
      id: `arc-${arc.id}`,
      severity: "info",
      title: "중심 인물 점검",
      message: `${arc.title} 아크의 중심 인물 연결을 확인하세요.`
    });
  });

  return warnings;
}

export function getCharacterEpisodeAppearances(project, characterId) {
  return [...(project.episodes ?? [])]
    .filter((episode) => episode.characterIds?.includes(characterId))
    .sort((a, b) => Number(a.number) - Number(b.number));
}

export function getCharacterLastAppearance(project, characterId) {
  const appearances = getCharacterEpisodeAppearances(project, characterId);
  return appearances.at(-1) ?? null;
}

export function getCharacterForeshadows(project, characterId) {
  const character = (project.characters ?? []).find((item) => item.id === characterId);
  const appearances = getCharacterEpisodeAppearances(project, characterId);
  const episodeForeshadowIds = new Set(appearances.flatMap((episode) => episode.foreshadowIds ?? []));
  const directForeshadowIds = new Set(character?.relatedForeshadowIds ?? []);

  return (project.foreshadows ?? []).filter(
    (foreshadow) =>
      foreshadow.relatedCharacterIds?.includes(characterId) ||
      directForeshadowIds.has(foreshadow.id) ||
      episodeForeshadowIds.has(foreshadow.id)
  );
}

export function getCharacterFactions(project, characterId) {
  const character = (project.characters ?? []).find((item) => item.id === characterId);
  const appearances = getCharacterEpisodeAppearances(project, characterId);
  const episodeFactionIds = new Set(appearances.flatMap((episode) => episode.factionIds ?? []));
  const directFactionIds = new Set(character?.relatedFactionIds ?? []);

  return (project.factions ?? []).filter(
    (faction) =>
      faction.relatedCharacterIds?.includes(characterId) ||
      directFactionIds.has(faction.id) ||
      episodeFactionIds.has(faction.id)
  );
}

export function getInactiveCharacters(project, threshold = 20) {
  const latestEpisode = maxEpisodeNumber(project);
  const importantValues = new Set(["주연", "빌런"]);

  return (project.characters ?? [])
    .map((character) => ({
      character,
      lastEpisode: getCharacterLastAppearance(project, character.id)?.number ?? character.lastEpisode ?? ""
    }))
    .filter(({ character, lastEpisode }) => importantValues.has(character.importance) && lastEpisode && latestEpisode - Number(lastEpisode) >= threshold);
}

export function getCharacterCardStats(project, characterId) {
  const appearances = getCharacterEpisodeAppearances(project, characterId);
  const foreshadows = getCharacterForeshadows(project, characterId);
  const factions = getCharacterFactions(project, characterId);
  const character = (project.characters ?? []).find((item) => item.id === characterId);
  const directWorldItemIds = new Set(character?.relatedWorldItemIds ?? []);
  const worldItems = (project.worldItems ?? []).filter((item) => item.relatedCharacterIds?.includes(characterId) || directWorldItemIds.has(item.id));

  return {
    appearances,
    appearanceCount: appearances.length,
    firstEpisode: appearances[0]?.number ?? "",
    lastEpisode: appearances.at(-1)?.number ?? "",
    foreshadowCount: foreshadows.length,
    factionCount: factions.length,
    worldItemCount: worldItems.length
  };
}
