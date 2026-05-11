function includes(value, query) {
  return String(value ?? "").toLowerCase().includes(query);
}

function arrayIncludes(values = [], query) {
  return values.some((value) => includes(value, query));
}

export function buildSearchResults(project, rawQuery) {
  const query = rawQuery.trim().toLowerCase();

  if (!query) return [];

  const results = [];

  project.arcs.forEach((arc) => {
    if (
      includes(arc.title, query) ||
      includes(arc.summary, query) ||
      includes(arc.question, query) ||
      includes(arc.range, query) ||
      includes(arc.act, query)
    ) {
      const firstEpisode = project.episodes.find((episode) => episode.arcId === arc.id || episode.arc === arc.title);

      results.push({
        id: `arc-${arc.id}`,
        type: "아크",
        title: arc.title,
        description: arc.summary || arc.question,
        target: firstEpisode ? { page: "episodes", id: firstEpisode.id } : { page: "dashboard", id: arc.id }
      });
    }
  });

  project.episodes.forEach((episode) => {
    if (
      includes(episode.title, query) ||
      includes(episode.purpose, query) ||
      includes(episode.summary, query) ||
      includes(episode.detail, query) ||
      includes(episode.hook, query) ||
      arrayIncludes(episode.tags, query)
    ) {
      results.push({
        id: `episode-${episode.id}`,
        type: "회차",
        title: `${episode.number}화. ${episode.title}`,
        description: episode.summary || episode.purpose,
        target: { page: "episodes", id: episode.id }
      });
    }
  });

  project.characters.forEach((character) => {
    if (
      includes(character.name, query) ||
      includes(character.role, query) ||
      includes(character.arc, query) ||
      includes(character.memo, query) ||
      arrayIncludes(character.tags, query)
    ) {
      results.push({
        id: `character-${character.id}`,
        type: "캐릭터",
        title: character.name,
        description: character.role,
        target: { page: "characters", id: character.id }
      });
    }
  });

  project.factions.forEach((faction) => {
    if (
      includes(faction.name, query) ||
      includes(faction.type, query) ||
      includes(faction.goal, query) ||
      includes(faction.conflictPoint, query) ||
      includes(faction.narrativeUse, query)
    ) {
      results.push({
        id: `faction-${faction.id}`,
        type: "세력",
        title: faction.name,
        description: faction.conflictPoint || faction.goal,
        target: { page: "factions", id: faction.id }
      });
    }
  });

  project.worldItems.forEach((item) => {
    if (
      includes(item.name, query) ||
      includes(item.category, query) ||
      includes(item.description, query) ||
      includes(item.rule, query) ||
      includes(item.narrativeUse, query)
    ) {
      results.push({
        id: `world-${item.id}`,
        type: "세계관",
        title: item.name,
        description: item.description || item.rule,
        target: { page: "world", id: item.id }
      });
    }
  });

  project.timeline.forEach((item) => {
    if (
      includes(item.timeLabel, query) ||
      includes(item.event, query) ||
      includes(item.impact, query) ||
      includes(item.hook, query) ||
      includes(item.type, query)
    ) {
      results.push({
        id: `timeline-${item.id}`,
        type: "연표",
        title: item.timeLabel,
        description: item.event,
        target: { page: "timeline", id: item.id }
      });
    }
  });

  project.foreshadows.forEach((item) => {
    if (
      includes(item.title, query) ||
      includes(item.description, query) ||
      includes(item.memo, query) ||
      includes(item.status, query)
    ) {
      results.push({
        id: `foreshadow-${item.id}`,
        type: "떡밥",
        title: item.title,
        description: item.description,
        target: { page: "foreshadows", id: item.id }
      });
    }
  });

  project.boardColumns.forEach((column) => {
    column.cards.forEach((card) => {
      if (includes(card.text, query) || includes(card.memo, query) || arrayIncludes(card.tags, query)) {
        results.push({
          id: `memo-${card.id}`,
          type: "메모",
          title: column.title,
          description: card.text,
          target: { page: "board", id: card.id }
        });
      }
    });
  });

  return results;
}
