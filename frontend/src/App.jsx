import { useEffect, useMemo, useState } from "react";

import {
  appMeta,
  storyDatasets,
  storyProjects,
} from "./data/storyData";

const tabs = [
  { id: "dashboard", label: "대시보드" },
  { id: "timeline", label: "연표" },
  { id: "roadmap", label: "200화 로드맵" },
  { id: "characters", label: "캐릭터" },
  { id: "factions", label: "세력" },
  { id: "world", label: "세계관" },
  { id: "board", label: "기획 보드" },
  { id: "sources", label: "원고 분석" }
];

const boardStorageKey = "story-200-board-v2";

function loadSavedBoards() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    return JSON.parse(window.localStorage.getItem(boardStorageKey)) ?? {};
  } catch {
    return {};
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedStoryId, setSelectedStoryId] = useState(storyProjects[0].id);
  const [selectedArc, setSelectedArc] = useState("all");
  const [query, setQuery] = useState("");
  const [savedBoards, setSavedBoards] = useState(loadSavedBoards);
  const [drafts, setDrafts] = useState({});

  const activeStory = storyProjects.find((story) => story.id === selectedStoryId) ?? storyProjects[0];
  const activeData = storyDatasets[activeStory.id] ?? storyDatasets[storyProjects[0].id];
  const {
    boardColumns,
    characters,
    episodeRoadmap,
    factions,
    locations,
    magicSystems,
    sourceFiles,
    storyArcs,
    storySpine,
    themes,
    timeline
  } = activeData;
  const savedBoard = savedBoards[selectedStoryId] ?? {};

  useEffect(() => {
    window.localStorage.setItem(boardStorageKey, JSON.stringify(savedBoards));
  }, [savedBoards]);

  useEffect(() => {
    setSelectedArc("all");
    setQuery("");
  }, [selectedStoryId]);

  const filteredEpisodes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return episodeRoadmap.filter((episode) => {
      const matchesArc = selectedArc === "all" || episode.arcId === selectedArc;
      const searchableText = [
        episode.title,
        episode.arcTitle,
        episode.act,
        episode.focus,
        episode.purpose,
        episode.status
      ]
        .join(" ")
        .toLowerCase();

      return matchesArc && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [episodeRoadmap, query, selectedArc]);

  function updateDraft(columnId, value) {
    setDrafts((current) => ({ ...current, [columnId]: value }));
  }

  function addBoardCard(columnId) {
    const text = drafts[columnId]?.trim();

    if (!text) {
      return;
    }

    setSavedBoards((current) => ({
      ...current,
      [selectedStoryId]: {
        ...(current[selectedStoryId] ?? {}),
        [columnId]: [...(current[selectedStoryId]?.[columnId] ?? []), text]
      }
    }));
    updateDraft(columnId, "");
  }

  function removeBoardCard(columnId, index) {
    setSavedBoards((current) => ({
      ...current,
      [selectedStoryId]: {
        ...(current[selectedStoryId] ?? {}),
        [columnId]: (current[selectedStoryId]?.[columnId] ?? []).filter((_, cardIndex) => cardIndex !== index)
      }
    }));
  }

  return (
    <main className="app-shell" style={{ "--story-accent": activeStory.accent }}>
      <aside className="sidebar" aria-label="스토리 룸 메뉴">
        <div className="brand-block">
          <span className="brand-mark">S2</span>
          <div>
            <p className="eyebrow">Longform Studio</p>
            <h1>{appMeta.name}</h1>
          </div>
        </div>

        <section className="story-switcher" aria-label="작품 선택">
          <p className="eyebrow">Active Story</p>
          {storyProjects.map((story) => (
            <button
              className={story.id === activeStory.id ? "story-option active" : "story-option"}
              disabled={story.disabled}
              key={story.id}
              type="button"
              onClick={() => setSelectedStoryId(story.id)}
            >
              <strong>{story.title}</strong>
              <span>{story.status}</span>
            </button>
          ))}
        </section>

        <nav className="tab-list">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? "tab-button active" : "tab-button"}
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-summary">
          <strong>{appMeta.tagline}</strong>
          <span>작품을 추가해도 같은 구조로 200화 설계를 확장할 수 있습니다.</span>
        </div>
      </aside>

      <section className="content-panel" key={`${activeStory.id}-${activeTab}`}>
        {activeTab === "dashboard" ? (
          <Dashboard
            activeStory={activeStory}
            characters={characters}
            factions={factions}
            locations={locations}
            sourceFiles={sourceFiles}
            storyArcs={storyArcs}
            storyProjects={storyProjects}
            storySpine={storySpine}
            themes={themes}
            timeline={timeline}
          />
        ) : null}
        {activeTab === "timeline" ? <TimelinePage activeStory={activeStory} timeline={timeline} /> : null}
        {activeTab === "roadmap" ? (
          <Roadmap
            filteredEpisodes={filteredEpisodes}
            query={query}
            selectedArc={selectedArc}
            setQuery={setQuery}
            setSelectedArc={setSelectedArc}
            storyArcs={storyArcs}
          />
        ) : null}
        {activeTab === "characters" ? <CharactersPage activeStory={activeStory} characters={characters} /> : null}
        {activeTab === "factions" ? <FactionsPage activeStory={activeStory} factions={factions} /> : null}
        {activeTab === "world" ? (
          <WorldPage activeStory={activeStory} locations={locations} magicSystems={magicSystems} />
        ) : null}
        {activeTab === "board" ? (
          <Board
            addBoardCard={addBoardCard}
            boardColumns={boardColumns}
            drafts={drafts}
            removeBoardCard={removeBoardCard}
            savedBoard={savedBoard}
            updateDraft={updateDraft}
          />
        ) : null}
        {activeTab === "sources" ? <Sources activeStory={activeStory} sourceFiles={sourceFiles} /> : null}
      </section>
    </main>
  );
}

function Dashboard({
  activeStory,
  characters,
  factions,
  locations,
  sourceFiles,
  storyArcs,
  storyProjects,
  storySpine,
  themes,
  timeline
}) {
  return (
    <div className="page-stack">
      <header className="page-header">
        <p className="eyebrow">{appMeta.name}</p>
        <h2>{activeStory.title}</h2>
        <p>{activeStory.logline}</p>
        <div className="hero-meta">
          <span>{activeStory.genre}</span>
          <span>{activeStory.targetEpisodes}화 목표</span>
          <span>{activeStory.status}</span>
        </div>
      </header>

      <section className="metric-grid" aria-label="기획 현황">
        <Metric value={storyProjects.length} label="작품 슬롯" />
        <Metric value={sourceFiles.length} label="현재 원고" />
        <Metric value={timeline.length} label="연표 사건" />
        <Metric value={characters.length} label="캐릭터" />
        <Metric value={factions.length} label="세력" />
      </section>

      <section className="project-grid">
        {storyProjects.map((story) => (
          <article className={story.disabled ? "project-card muted" : "project-card"} key={story.id}>
            <div>
              <p className="eyebrow">{story.status}</p>
              <h3>{story.title}</h3>
            </div>
            <p>{story.subtitle}</p>
            <small>{story.theme}</small>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel large-panel">
          <div className="section-heading">
            <p className="eyebrow">Core spine</p>
            <h3>작품의 척추</h3>
          </div>
          <ol className="spine-list">
            {storySpine.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </article>

        <article className="panel">
          <div className="section-heading">
            <p className="eyebrow">Theme bank</p>
            <h3>반복해서 밀어야 할 주제</h3>
          </div>
          <div className="chip-list">
            {themes.map((theme) => (
              <span className="chip" key={theme}>
                {theme}
              </span>
            ))}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Arc map</p>
          <h3>{storyArcs.length}개 아크로 나눈 200화 구조</h3>
        </div>
        <div className="arc-grid">
          {storyArcs.map((arc) => (
            <article className="arc-card" key={arc.id}>
              <span>{arc.act}</span>
              <strong>
                {arc.range} · {arc.title}
              </strong>
              <p>{arc.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="map-panel">
        <div className="section-heading">
          <p className="eyebrow">World overview</p>
          <h3>세계 이동축</h3>
        </div>
        <div className="world-map" aria-label="주요 지역 관계도">
          {locations.slice(0, 6).map((location, index) => (
            <span className={`map-node node-${index + 1}`} key={location.name}>
              {location.name}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ value, label }) {
  return (
    <article className="metric-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function Roadmap({ filteredEpisodes, query, selectedArc, setQuery, setSelectedArc, storyArcs }) {
  const arcUnit = storyArcs.length ? Math.round(200 / storyArcs.length) : 0;

  return (
    <div className="page-stack">
      <header className="page-header compact">
        <p className="eyebrow">Roadmap</p>
        <h2>200화 장편 로드맵</h2>
        <p>아크별 {arcUnit}화 단위로 큰 사건, 감정 변화, 다음 훅을 끊어볼 수 있습니다.</p>
      </header>

      <section className="toolbar" aria-label="로드맵 필터">
        <label>
          <span>아크</span>
          <select value={selectedArc} onChange={(event) => setSelectedArc(event.target.value)}>
            <option value="all">전체 아크</option>
            {storyArcs.map((arc) => (
              <option key={arc.id} value={arc.id}>
                {arc.range} {arc.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>검색</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="인물, 목적, 제목 검색"
          />
        </label>
        <div className="result-count">{filteredEpisodes.length}개 표시</div>
      </section>

      <section className="episode-grid">
        {filteredEpisodes.map((episode) => (
          <article className="episode-card" key={episode.episode}>
            <div className="episode-meta">
              <span>{episode.act}</span>
              <span>{episode.status}</span>
            </div>
            <strong>
              {episode.episode}화. {episode.title}
            </strong>
            <p>{episode.arcTitle}</p>
            <div className="episode-footer">
              <span>{episode.purpose}</span>
              <span>{episode.focus}</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function TimelinePage({ activeStory, timeline }) {
  return (
    <div className="page-stack">
      <header className="page-header compact">
        <p className="eyebrow">Timeline</p>
        <h2>{activeStory.title} 연표</h2>
        <p>재앙 이전부터 최종부까지, 독자가 따라갈 핵심 사건과 떡밥 회수 지점을 순서대로 정리했습니다.</p>
      </header>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Chronicle</p>
          <h3>상세 사건 흐름</h3>
        </div>
        <div className="timeline detailed">
          {timeline.map((item, index) => (
            <article className="timeline-item detailed" key={`${item.era}-${item.event}`}>
              <div className="timeline-index">{String(index + 1).padStart(2, "0")}</div>
              <div>
                <span>{item.era}</span>
                <strong>{item.event}</strong>
                <p>{item.impact}</p>
                {item.hook ? <small>{item.hook}</small> : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function CharactersPage({ activeStory, characters }) {
  return (
    <div className="page-stack">
      <header className="page-header compact">
        <p className="eyebrow">Characters</p>
        <h2>{activeStory.title} 캐릭터 스펙표</h2>
        <p>외모, 인상, 복장, 상처, 욕망을 한 카드에 묶었습니다. 장면을 쓸 때 바로 꺼내 보는 인물 바이블입니다.</p>
      </header>

      <section className="character-grid">
        {characters.map((character) => (
          <article className="character-card" key={character.name}>
            <div className="character-topline">
              <div>
                <p className="eyebrow">{character.role}</p>
                <h3>{character.name}</h3>
              </div>
              <span>{character.status}</span>
            </div>

            <div className="portrait-panel">
              <div className="portrait-mark">{character.name.slice(0, 1)}</div>
              <p>{character.spec?.appearance}</p>
            </div>

            <dl className="spec-grid">
              <div>
                <dt>나이대</dt>
                <dd>{character.spec?.age ?? "미정"}</dd>
              </div>
              <div>
                <dt>신장/체형</dt>
                <dd>{character.spec?.height ?? "미정"}</dd>
              </div>
              <div>
                <dt>머리/눈</dt>
                <dd>{character.spec?.colors ?? "미정"}</dd>
              </div>
              <div>
                <dt>복장</dt>
                <dd>{character.spec?.outfit ?? "미정"}</dd>
              </div>
              <div>
                <dt>첫인상</dt>
                <dd>{character.spec?.impression ?? "미정"}</dd>
              </div>
              <div>
                <dt>상징</dt>
                <dd>{character.spec?.motif ?? "미정"}</dd>
              </div>
            </dl>

            <div className="character-drama">
              <dl>
                <div>
                  <dt>상처</dt>
                  <dd>{character.wound}</dd>
                </div>
                <div>
                  <dt>욕망</dt>
                  <dd>{character.desire}</dd>
                </div>
                <div>
                  <dt>아크</dt>
                  <dd>{character.arc}</dd>
                </div>
              </dl>
            </div>

            <div className="chip-list small">
              {character.tags.map((tag) => (
                <span className="chip" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function FactionsPage({ activeStory, factions }) {
  return (
    <div className="page-stack">
      <header className="page-header compact">
        <p className="eyebrow">Factions</p>
        <h2>{activeStory.title} 세력 구도</h2>
        <p>각 세력은 매화 갈등을 만드는 엔진입니다. 명분, 충돌 지점, 사용법을 따로 보이게 정리했습니다.</p>
      </header>

      <section className="faction-grid">
        {factions.map((faction) => (
          <article className="faction-card" key={faction.name}>
            <div className="card-title-row">
              <h3>{faction.name}</h3>
              <span>{faction.type}</span>
            </div>
            <dl>
              <div>
                <dt>목표</dt>
                <dd>{faction.goal}</dd>
              </div>
              <div>
                <dt>충돌</dt>
                <dd>{faction.conflict}</dd>
              </div>
              <div>
                <dt>서사 사용법</dt>
                <dd>{faction.use}</dd>
              </div>
            </dl>
          </article>
        ))}
      </section>
    </div>
  );
}

function WorldPage({ activeStory, locations, magicSystems }) {
  return (
    <div className="page-stack">
      <header className="page-header compact">
        <p className="eyebrow">World Codex</p>
        <h2>{activeStory.title} 세계관과 마법 규칙</h2>
        <p>지역, 마법, 병, 성역을 따로 분리했습니다. 독자가 헷갈리지 않게 규칙과 대가가 먼저 보이도록 했습니다.</p>
      </header>

      <section className="two-column">
        <article className="panel">
          <div className="section-heading">
            <p className="eyebrow">Magic</p>
            <h3>마법 규칙</h3>
          </div>
          <div className="stack-list">
            {magicSystems.map((system) => (
              <div className="list-card interactive" key={system.name}>
                <strong>{system.name}</strong>
                <p>{system.rule}</p>
                <small>{system.cost}</small>
                <em>{system.storyUse}</em>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <p className="eyebrow">Locations</p>
            <h3>주요 지역</h3>
          </div>
          <div className="stack-list">
            {locations.map((location) => (
              <div className="list-card interactive" key={location.name}>
                <strong>{location.name}</strong>
                <span>{location.category}</span>
                <p>{location.note}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">World overview</p>
          <h3>세계 이동축</h3>
        </div>
        <div className="world-map expanded" aria-label="주요 지역 관계도">
          {locations.slice(0, 10).map((location, index) => (
            <span className={`map-node node-${(index % 6) + 1}`} key={location.name}>
              {location.name}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function Board({ addBoardCard, boardColumns, drafts, removeBoardCard, savedBoard, updateDraft }) {
  return (
    <div className="page-stack">
      <header className="page-header compact">
        <p className="eyebrow">Planning board</p>
        <h2>기획 게시판</h2>
        <p>추가한 메모는 브라우저 localStorage에 저장됩니다. DB 없이 GitHub Pages에서 동작합니다.</p>
      </header>

      <section className="board-grid">
        {boardColumns.map((column) => {
          const customCards = savedBoard[column.id] ?? [];

          return (
            <article className="board-column" key={column.id}>
              <div className="board-column-head">
                <h3>{column.title}</h3>
                <span>{column.cards.length + customCards.length}</span>
              </div>

              <div className="board-card-list">
                {column.cards.map((card) => (
                  <div className="board-card seed" key={card}>
                    {card}
                  </div>
                ))}
                {customCards.map((card, index) => (
                  <div className="board-card custom" key={`${card}-${index}`}>
                    <span>{card}</span>
                    <button
                      aria-label="메모 삭제"
                      className="icon-button"
                      type="button"
                      onClick={() => removeBoardCard(column.id, index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <form
                className="board-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  addBoardCard(column.id);
                }}
              >
                <input
                  value={drafts[column.id] ?? ""}
                  onChange={(event) => updateDraft(column.id, event.target.value)}
                  placeholder="새 메모"
                />
                <button type="submit">추가</button>
              </form>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function Sources({ activeStory, sourceFiles }) {
  return (
    <div className="page-stack">
      <header className="page-header compact">
        <p className="eyebrow">Source analysis</p>
        <h2>{activeStory.title} 원고 분석</h2>
        <p>각 원고가 장편 설계에서 담당하는 역할과 앞으로 보강할 지점을 정리했습니다.</p>
      </header>

      <section className="source-grid">
        {sourceFiles.map((source) => (
          <article className="source-card" key={source.file}>
            <span>{source.role}</span>
            <h3>{source.title}</h3>
            <p>{source.note}</p>
            <small>
              {source.file} · {source.phases} phases
            </small>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Next data</p>
          <h3>추가로 만들면 좋은 자료</h3>
        </div>
        <div className="next-data-grid">
          <div>인물별 말투, 금지어, 감정 트리거</div>
          <div>세력별 목표, 자원, 적대 관계</div>
          <div>마법 사용 비용과 회복 규칙</div>
          <div>지역별 지도, 이동 거리, 계절 변화</div>
          <div>200화 전체 떡밥 회수표</div>
          <div>화별 POV, 클리프행어, 감정 목표</div>
        </div>
      </section>
    </div>
  );
}
