import { useEffect, useMemo, useState } from "react";

import {
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
} from "./data/storyData";

const tabs = [
  { id: "dashboard", label: "대시보드" },
  { id: "roadmap", label: "200화 로드맵" },
  { id: "codex", label: "설정집" },
  { id: "board", label: "기획 보드" },
  { id: "sources", label: "원고 분석" }
];

const boardStorageKey = "gray-winter-story-board-v1";

function loadSavedBoard() {
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
  const [selectedArc, setSelectedArc] = useState("all");
  const [query, setQuery] = useState("");
  const [savedBoard, setSavedBoard] = useState(loadSavedBoard);
  const [drafts, setDrafts] = useState({});

  useEffect(() => {
    window.localStorage.setItem(boardStorageKey, JSON.stringify(savedBoard));
  }, [savedBoard]);

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
  }, [query, selectedArc]);

  function updateDraft(columnId, value) {
    setDrafts((current) => ({ ...current, [columnId]: value }));
  }

  function addBoardCard(columnId) {
    const text = drafts[columnId]?.trim();

    if (!text) {
      return;
    }

    setSavedBoard((current) => ({
      ...current,
      [columnId]: [...(current[columnId] ?? []), text]
    }));
    updateDraft(columnId, "");
  }

  function removeBoardCard(columnId, index) {
    setSavedBoard((current) => ({
      ...current,
      [columnId]: (current[columnId] ?? []).filter((_, cardIndex) => cardIndex !== index)
    }));
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="스토리 룸 메뉴">
        <div className="brand-block">
          <span className="brand-mark">GW</span>
          <div>
            <p className="eyebrow">Story Room</p>
            <h1>잿빛 눈물의 겨울</h1>
          </div>
        </div>

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

        <div className="deploy-note">
          <strong>GitHub Pages ready</strong>
          <span>정적 React 앱이라 새 저장소에 올려도 기존 Pages를 건드리지 않습니다.</span>
        </div>
      </aside>

      <section className="content-panel">
        {activeTab === "dashboard" ? <Dashboard /> : null}
        {activeTab === "roadmap" ? (
          <Roadmap
            filteredEpisodes={filteredEpisodes}
            query={query}
            selectedArc={selectedArc}
            setQuery={setQuery}
            setSelectedArc={setSelectedArc}
          />
        ) : null}
        {activeTab === "codex" ? <Codex /> : null}
        {activeTab === "board" ? (
          <Board
            addBoardCard={addBoardCard}
            drafts={drafts}
            removeBoardCard={removeBoardCard}
            savedBoard={savedBoard}
            updateDraft={updateDraft}
          />
        ) : null}
        {activeTab === "sources" ? <Sources /> : null}
      </section>
    </main>
  );
}

function Dashboard() {
  return (
    <div className="page-stack">
      <header className="page-header">
        <p className="eyebrow">200 episode planning hub</p>
        <h2>원고에서 뽑은 설정을 한 화면에서 관리하는 장편 기획실</h2>
        <p>
          현재 4개 텍스트 원고의 핵심 축을 정리하고, 이후 200화 분량으로 확장할 수
          있는 아크, 인물, 세력, 세계관 데이터를 배치했습니다.
        </p>
      </header>

      <section className="metric-grid" aria-label="기획 현황">
        <Metric value={sourceFiles.length} label="분석 원고" />
        <Metric value="47" label="기존 phase" />
        <Metric value={characters.length} label="핵심 인물" />
        <Metric value={episodeRoadmap.length} label="로드맵 화수" />
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
          <h3>10개 아크로 나눈 200화 구조</h3>
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

function Roadmap({ filteredEpisodes, query, selectedArc, setQuery, setSelectedArc }) {
  return (
    <div className="page-stack">
      <header className="page-header compact">
        <p className="eyebrow">Roadmap</p>
        <h2>200화 장편 로드맵</h2>
        <p>아크별 20화 단위로 큰 사건, 감정 변화, 다음 훅을 끊어볼 수 있습니다.</p>
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

function Codex() {
  return (
    <div className="page-stack">
      <header className="page-header compact">
        <p className="eyebrow">Codex</p>
        <h2>인물, 세력, 세계관 설정집</h2>
        <p>장편 연재 중 흔들리기 쉬운 설정을 빠르게 대조할 수 있게 묶었습니다.</p>
      </header>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Characters</p>
          <h3>핵심 인물</h3>
        </div>
        <div className="card-grid">
          {characters.map((character) => (
            <article className="detail-card" key={character.name}>
              <div className="card-title-row">
                <h4>{character.name}</h4>
                <span>{character.status}</span>
              </div>
              <p className="role-text">{character.role}</p>
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
              <div className="chip-list small">
                {character.tags.map((tag) => (
                  <span className="chip" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="section-heading">
            <p className="eyebrow">Factions</p>
            <h3>세력</h3>
          </div>
          <div className="stack-list">
            {factions.map((faction) => (
              <div className="list-card" key={faction.name}>
                <strong>{faction.name}</strong>
                <span>{faction.type}</span>
                <p>{faction.use}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <p className="eyebrow">Magic</p>
            <h3>마법 규칙</h3>
          </div>
          <div className="stack-list">
            {magicSystems.map((system) => (
              <div className="list-card" key={system.name}>
                <strong>{system.name}</strong>
                <p>{system.rule}</p>
                <small>{system.cost}</small>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Timeline</p>
          <h3>연표</h3>
        </div>
        <div className="timeline">
          {timeline.map((item) => (
            <article className="timeline-item" key={`${item.era}-${item.event}`}>
              <span>{item.era}</span>
              <strong>{item.event}</strong>
              <p>{item.impact}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Board({ addBoardCard, drafts, removeBoardCard, savedBoard, updateDraft }) {
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

function Sources() {
  return (
    <div className="page-stack">
      <header className="page-header compact">
        <p className="eyebrow">Source analysis</p>
        <h2>현재 텍스트 4개에서 취합한 자료</h2>
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
