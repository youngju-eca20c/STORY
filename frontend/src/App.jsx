import { useEffect, useMemo, useState } from "react";

import { appMeta, storyProjects } from "./data/storyData";
import {
  getCharacterAppearanceCounts,
  getCharacterCardStats,
  getCharacterEpisodeAppearances,
  getCharacterFactions,
  getCharacterForeshadows,
  getCharacterLastAppearance,
  getDashboardWarnings,
  getEpisodeProgress,
  getEpisodeStatusCounts,
  getForeshadowStats,
  getInactiveMainCharacters,
  getStaleForeshadows,
  getTagCounts,
  getTagOveruseWarnings,
  getUnplannedEpisodeRanges
} from "./utils/analytics";
import { buildSearchResults } from "./utils/search";
import {
  createSeedWorkspace,
  episodeStatuses,
  foreshadowStatuses,
  makeId,
  timelineTypes,
  worldCategories
} from "./utils/normalize";
import { loadBoardColumns, saveBoardColumns } from "./utils/storage";

const pages = [
  { id: "dashboard", label: "대시보드", short: "DB" },
  { id: "episodes", label: "회차 로드맵", short: "EP" },
  { id: "foreshadows", label: "떡밥 추적", short: "FB" },
  { id: "characters", label: "캐릭터 도감", short: "CH" },
  { id: "factions", label: "세력", short: "FC" },
  { id: "world", label: "세계관", short: "WD" },
  { id: "timeline", label: "연표", short: "TL" },
  { id: "pacing", label: "페이싱 분석", short: "PC" },
  { id: "board", label: "기획 보드", short: "BD" },
  { id: "sources", label: "원고 분석", short: "SC" },
  { id: "search", label: "전체 검색", short: "SR" }
];

const characterTabs = [
  { id: "profile", label: "기본 정보" },
  { id: "appearance", label: "외형" },
  { id: "voice", label: "성격 / 말투" },
  { id: "arc", label: "서사 아크" },
  { id: "relations", label: "관계" },
  { id: "episodes", label: "등장 회차" },
  { id: "lore", label: "떡밥 / 세계관" }
];

const now = () => new Date().toISOString();

export default function App() {
  const workspace = useMemo(() => createSeedWorkspace(), []);
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState(() => workspace.projects[0]?.id ?? "");
  const [selectedIds, setSelectedIds] = useState({});
  const [boardColumns, setBoardColumns] = useState([]);
  const baseProject = useMemo(
    () => workspace.projects.find((item) => item.id === selectedProjectId) ?? workspace.projects[0],
    [selectedProjectId, workspace.projects]
  );
  const project = useMemo(() => ({ ...baseProject, boardColumns }), [baseProject, boardColumns]);
  const disabledStorySlots = storyProjects.filter((story) => story.disabled);

  useEffect(() => {
    if (baseProject) setBoardColumns(loadBoardColumns(baseProject.id, baseProject.boardColumns));
  }, [baseProject]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activePage, selectedProjectId]);

  function updateBoardColumns(updater) {
    setBoardColumns((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      saveBoardColumns(project.id, next);
      return next;
    });
  }

  function navigateTo(target) {
    setActivePage(target.page);
    setSelectedIds((current) => ({ ...current, [target.page]: target.id }));
  }

  function selectProject(projectId) {
    setSelectedProjectId(projectId);
    setActivePage("dashboard");
    setSelectedIds({});
  }

  if (!project) {
    return <EmptyState title="작품 데이터가 없습니다" description="data 파일을 확인해 주세요." />;
  }

  const pageProps = {
    project,
    selectedIds,
    setSelectedIds,
    navigateTo
  };

  return (
    <main className="app-shell viewer-mode" style={{ "--story-accent": project.meta.accent }}>
      <Sidebar
        activePage={activePage}
        disabledStorySlots={disabledStorySlots}
        onSelectPage={setActivePage}
        onSelectProject={selectProject}
        pages={pages}
        project={project}
        projects={workspace.projects}
      />

      <section className="workspace">
        {activePage === "dashboard" ? <DashboardPage {...pageProps} /> : null}
        {activePage === "episodes" ? <EpisodesPage {...pageProps} /> : null}
        {activePage === "foreshadows" ? <ForeshadowsPage {...pageProps} /> : null}
        {activePage === "characters" ? <CharactersPage {...pageProps} /> : null}
        {activePage === "factions" ? <FactionsPage {...pageProps} /> : null}
        {activePage === "world" ? <WorldPage {...pageProps} /> : null}
        {activePage === "timeline" ? <TimelinePage {...pageProps} /> : null}
        {activePage === "pacing" ? <PacingPage {...pageProps} /> : null}
        {activePage === "board" ? <BoardPage project={project} updateBoardColumns={updateBoardColumns} navigateTo={navigateTo} /> : null}
        {activePage === "sources" ? <SourcesPage {...pageProps} /> : null}
        {activePage === "search" ? <SearchPage {...pageProps} /> : null}
      </section>
    </main>
  );
}

function Sidebar({ activePage, disabledStorySlots, onSelectPage, onSelectProject, pages, project, projects }) {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">S2</div>
        <div>
          <h1>{appMeta.name}</h1>
          <p>장편 웹소설 기획실</p>
        </div>
      </div>

      <div className="story-switcher">
        <p>작품</p>
        {projects.map((item) => (
          <button
            className={item.id === project.id ? "story-option active" : "story-option"}
            key={item.id}
            type="button"
            onClick={() => onSelectProject(item.id)}
          >
            <strong>{item.meta.title}</strong>
            <span>{item.meta.status}</span>
            <i className="story-progress">
              <b style={{ width: `${getEpisodeProgress(item)}%` }} />
            </i>
          </button>
        ))}
        {disabledStorySlots.map((item) => (
          <div className="story-option disabled" key={item.id}>
            <strong>{item.title}</strong>
            <span>{item.status}</span>
          </div>
        ))}
      </div>

      <nav className="section-tabs">
        {pages.map((page) => (
          <button className={activePage === page.id ? "tab-button active" : "tab-button"} key={page.id} type="button" onClick={() => onSelectPage(page.id)}>
            <span className="tab-glyph">{page.short}</span>
            <span>{page.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

function DashboardPage({ project, navigateTo, setSelectedIds }) {
  const statusCounts = getEpisodeStatusCounts(project);
  const foreshadowStats = getForeshadowStats(project);
  const warnings = getDashboardWarnings(project);
  const recentEpisodes = [...project.episodes].sort((a, b) => new Date(b.updatedAt ?? 0) - new Date(a.updatedAt ?? 0)).slice(0, 5);
  const majorArcs = project.arcs.slice(0, 6);

  return (
    <PageShell description="Codex가 정리한 장편 웹소설 데이터를 한눈에 탐색합니다." eyebrow="Story Bible" title={project.meta.title}>
      <section className="hero-summary">
        <Card className="project-hero-card">
          <Badge tone="accent">{project.meta.genre}</Badge>
          <h3>{project.meta.logline}</h3>
          <p>{project.meta.theme}</p>
          <div className="spine-list">
            {project.storySpine.slice(0, 4).map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </Card>
        <div className="stat-grid compact">
          <StatCard label="기획 진행률" value={`${getEpisodeProgress(project)}%`} />
          <StatCard label="목표 회차" value={project.meta.targetEpisodes} />
          <StatCard label="캐릭터" value={project.characters.length} />
          <StatCard label="세력" value={project.factions.length} />
          <StatCard label="세계관" value={project.worldItems.length} />
          <StatCard label="미회수 떡밥" tone="warning" value={foreshadowStats.unresolved} />
        </div>
      </section>

      <EpisodeMiniMap episodes={project.episodes} onSelect={(episode) => navigateTo({ page: "episodes", id: episode.id })} selectedId="" />

      <section className="dashboard-layout">
        <Card>
          <SectionTitle eyebrow="Arcs" title="주요 아크" />
          <div className="arc-card-grid">
            {majorArcs.map((arc) => {
              const episodes = getArcEpisodes(project, arc);
              return (
                <button className="arc-card" key={arc.id} type="button" onClick={() => episodes[0] && navigateTo({ page: "episodes", id: episodes[0].id })}>
                  <span>{arc.range || `${episodes[0]?.number ?? "?"}-${episodes.at(-1)?.number ?? "?"}화`}</span>
                  <strong>{arc.title}</strong>
                  <p>{arc.summary}</p>
                  <small>{episodes.length}개 회차</small>
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <SectionTitle eyebrow="Warnings" title="작가용 경고" />
          <WarningCards warnings={warnings} />
        </Card>
      </section>

      <Card>
        <SectionTitle eyebrow="Recent" title="최근 수정/중요 회차" />
        <div className="episode-list">
          {recentEpisodes.map((episode) => (
            <button
              className="episode-row"
              key={episode.id}
              type="button"
              onClick={() => {
                setSelectedIds((current) => ({ ...current, episodes: episode.id }));
                navigateTo({ page: "episodes", id: episode.id });
              }}
            >
              <span className="episode-number">{episode.number}</span>
              <div>
                <strong>{episode.title}</strong>
                <p>{episode.summary || episode.purpose}</p>
                <div className="chip-strip">
                  <Badge tone={statusTone(episode.status)}>{episode.status}</Badge>
                  {(episode.tags ?? []).slice(0, 3).map((tag) => <Badge key={tag} tone="muted">{tag}</Badge>)}
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}

function EpisodesPage({ project, selectedIds, setSelectedIds, navigateTo }) {
  const [query, setQuery] = useState("");
  const [arcFilter, setArcFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const arcs = project.arcs;
  const tags = [...new Set(project.episodes.flatMap((episode) => episode.tags ?? []))].sort();
  const filtered = project.episodes.filter((episode) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || [episode.title, episode.purpose, episode.summary, episode.detail, episode.hook, ...(episode.tags ?? [])].join(" ").toLowerCase().includes(q);
    const matchesArc = arcFilter === "all" || episode.arcId === arcFilter || episode.arc === arcFilter;
    const matchesStatus = statusFilter === "all" || episode.status === statusFilter;
    const matchesTag = tagFilter === "all" || episode.tags?.includes(tagFilter);
    return matchesQuery && matchesArc && matchesStatus && matchesTag;
  });
  const selected = project.episodes.find((episode) => episode.id === selectedIds.episodes) ?? filtered[0] ?? project.episodes[0];

  function selectEpisode(episode) {
    setSelectedIds((current) => ({ ...current, episodes: episode.id }));
  }

  return (
    <PageShell description="1~200화 흐름을 아크, 상태, 태그, 연결 데이터로 탐색합니다." eyebrow="Episodes" title="회차 로드맵">
      <EpisodeMiniMap episodes={project.episodes} onSelect={selectEpisode} selectedId={selected?.id} />
      <Card className="filter-toolbar">
        <SearchInput value={query} onChange={setQuery} placeholder="회차 제목, 목적, 요약 검색" />
        <SelectField value={arcFilter} onChange={setArcFilter}>
          <option value="all">전체 아크</option>
          {arcs.map((arc) => <option key={arc.id} value={arc.id}>{arc.title}</option>)}
        </SelectField>
        <SelectField value={statusFilter} onChange={setStatusFilter}>
          <option value="all">전체 상태</option>
          {episodeStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </SelectField>
        <SelectField value={tagFilter} onChange={setTagFilter}>
          <option value="all">전체 태그</option>
          {tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
        </SelectField>
      </Card>

      <section className="viewer-layout">
        <div className="viewer-list">
          {filtered.map((episode) => (
            <button className={selected?.id === episode.id ? "episode-row active" : "episode-row"} key={episode.id} type="button" onClick={() => selectEpisode(episode)}>
              <span className="episode-number">{episode.number}</span>
              <div>
                <strong>{episode.title}</strong>
                <p>{episode.summary || episode.purpose}</p>
                <div className="chip-strip">
                  <Badge tone={statusTone(episode.status)}>{episode.status}</Badge>
                  {(episode.tags ?? []).slice(0, 4).map((tag) => <Badge key={tag} tone="muted">{tag}</Badge>)}
                </div>
              </div>
            </button>
          ))}
        </div>
        <EpisodeDetail episode={selected} project={project} navigateTo={navigateTo} />
      </section>
    </PageShell>
  );
}

function EpisodeDetail({ episode, project, navigateTo }) {
  if (!episode) return <ViewerPanel title="회차 선택" description="왼쪽에서 회차를 선택하세요." />;
  const next = project.episodes.find((item) => Number(item.number) === Number(episode.number) + 1);

  return (
    <ViewerPanel
      title={`${episode.number}화. ${episode.title}`}
      description={episode.arc || episode.part || "아크 미정"}
      actions={<Badge tone={statusTone(episode.status)}>{episode.status}</Badge>}
    >
      <InfoGrid
        items={[
          ["아크", episode.arc],
          ["파트", episode.part],
          ["중심 요소", episode.focus],
          ["소스", episode.sourceType]
        ]}
      />
      <ReadSection title="회차 목적" body={episode.purpose} />
      <ReadSection title="핵심 사건 / 요약" body={episode.summary} />
      <ReadSection title="상세 줄거리" body={episode.detail} />
      <ReadSection title="마지막 후킹" body={episode.hook} />
      {next ? (
        <button className="next-link-card" type="button" onClick={() => navigateTo({ page: "episodes", id: next.id })}>
          <span>다음 화 연결</span>
          <strong>{next.number}화. {next.title}</strong>
        </button>
      ) : null}
      <EntityLinks title="등장 캐릭터" items={idsToEntities(project.characters, episode.characterIds)} page="characters" navigateTo={navigateTo} />
      <EntityLinks title="관련 세력" items={idsToEntities(project.factions, episode.factionIds)} page="factions" navigateTo={navigateTo} />
      <EntityLinks title="관련 세계관" items={idsToEntities(project.worldItems, episode.worldItemIds)} page="world" navigateTo={navigateTo} />
      <EntityLinks title="관련 떡밥" items={idsToEntities(project.foreshadows, episode.foreshadowIds)} page="foreshadows" navigateTo={navigateTo} />
      <TagList tags={episode.tags} />
    </ViewerPanel>
  );
}

function CharactersPage({ project, selectedIds, setSelectedIds, navigateTo }) {
  const [query, setQuery] = useState("");
  const [importanceFilter, setImportanceFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("profile");
  const tags = [...new Set(project.characters.flatMap((character) => character.tags ?? []))].sort();
  const filtered = project.characters.filter((character) => {
    const q = query.trim().toLowerCase();
    const searchable = [character.name, character.alias, character.role, character.importance, character.status, character.affiliation, character.desire, character.characterArc, ...(character.tags ?? [])].join(" ").toLowerCase();
    return (!q || searchable.includes(q)) && (importanceFilter === "all" || character.importance === importanceFilter) && (tagFilter === "all" || character.tags?.includes(tagFilter));
  });
  const selected = project.characters.find((character) => character.id === selectedIds.characters) ?? filtered[0] ?? project.characters[0];

  useEffect(() => setActiveTab("profile"), [selected?.id]);

  return (
    <PageShell className="characters-page" description="인물의 외형, 욕망, 관계, 회차 연결을 도감처럼 탐색합니다." eyebrow="Characters" title="캐릭터 도감">
      <Card className="character-toolbar">
        <SearchInput value={query} onChange={setQuery} placeholder="캐릭터 이름, 태그, 아크 검색" />
        <SelectField value={importanceFilter} onChange={setImportanceFilter}>
          <option value="all">전체 중요도</option>
          {["주연", "조연", "단역", "빌런", "조력자"].map((item) => <option key={item} value={item}>{item}</option>)}
        </SelectField>
        <SelectField value={tagFilter} onChange={setTagFilter}>
          <option value="all">전체 태그</option>
          {tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
        </SelectField>
      </Card>
      <section className="character-studio">
        <div className="character-directory">
          <div className="character-card-grid">
            {filtered.map((character) => (
              <CharacterCard
                character={character}
                key={character.id}
                selected={selected?.id === character.id}
                stats={getCharacterCardStats(project, character.id)}
                onSelect={() => setSelectedIds((current) => ({ ...current, characters: character.id }))}
              />
            ))}
          </div>
          {!filtered.length ? <EmptyState title="조건에 맞는 캐릭터가 없습니다" description="검색어나 필터를 바꿔 보세요." /> : null}
        </div>
        <CharacterDetail
          activeTab={activeTab}
          character={selected}
          navigateTo={navigateTo}
          project={project}
          setActiveTab={setActiveTab}
        />
      </section>
    </PageShell>
  );
}

function CharacterCard({ character, onSelect, selected, stats }) {
  return (
    <button className={selected ? "character-profile-card active" : "character-profile-card"} type="button" onClick={onSelect}>
      {selected ? <span className="selected-check">✓</span> : null}
      <CharacterAvatar character={character} size="card" />
      <div className="character-card-body">
        <div className="character-card-head">
          <div>
            <h3>{character.name}</h3>
            <p>{character.alias || character.role || "역할 미정"}</p>
          </div>
          <Badge tone={importanceTone(character.importance)}>{character.importance}</Badge>
        </div>
        <div className="chip-strip">
          <Badge tone={characterStatusTone(character.status)}>{character.status || "미정"}</Badge>
          {character.affiliation ? <Badge tone="muted">{character.affiliation}</Badge> : null}
        </div>
        <div className="character-episode-line">
          <span>첫 등장 {stats?.firstEpisode || character.firstEpisode || "-"}화</span>
          <span>최근 {stats?.lastEpisode || character.lastEpisode || "-"}화</span>
        </div>
        <div className="character-card-stats">
          <span>등장 {stats?.appearanceCount ?? 0}회</span>
          <span>떡밥 {stats?.foreshadowCount ?? 0}개</span>
          <span>관계 {character.relatedCharacterIds?.length ?? 0}명</span>
        </div>
        <p className="character-desire">{character.desire || character.memo || character.appearanceSummary || "핵심 욕망을 정리할 인물입니다."}</p>
        <TagList tags={(character.tags ?? []).slice(0, 4)} compact />
      </div>
    </button>
  );
}

function CharacterDetail({ activeTab, character, navigateTo, project, setActiveTab }) {
  if (!character) return <ViewerPanel title="캐릭터 선택" description="왼쪽에서 인물을 선택하세요." />;
  const appearances = getCharacterEpisodeAppearances(project, character.id);
  const relatedForeshadows = getCharacterForeshadows(project, character.id);
  const relatedFactions = getCharacterFactions(project, character.id);
  const relatedWorldItems = project.worldItems.filter((item) => item.relatedCharacterIds?.includes(character.id) || character.relatedWorldItemIds?.includes(item.id));
  const relatedCharacters = idsToEntities(project.characters, character.relatedCharacterIds);
  const last = getCharacterLastAppearance(project, character.id);

  return (
    <aside className="character-detail-panel">
      <div className="character-hero">
        <CharacterAvatar character={character} size="hero" />
        <div className="character-hero-main">
          <div className="character-hero-top">
            <div className="character-hero-title">
              <h3>{character.name}</h3>
              <p>{character.role || character.alias || "역할 미정"}</p>
            </div>
            <div className="character-updated">
              <span>최근 등장</span>
              <strong>{last ? `${last.number}화` : character.lastEpisode || "-"}</strong>
            </div>
          </div>
          <div className="chip-strip">
            <Badge tone={importanceTone(character.importance)}>{character.importance}</Badge>
            <Badge tone={characterStatusTone(character.status)}>{character.status || "미정"}</Badge>
            {character.affiliation ? <Badge tone="muted">{character.affiliation}</Badge> : null}
          </div>
          <div className="character-fact-row">
            <span>{character.species || "종족 미정"}</span>
            <span>{character.gender || "성별 미정"}</span>
            <span>{character.age || "나이 미정"}</span>
            <span>{character.job || "직업 미정"}</span>
            <span>{character.affiliation || "소속 없음"}</span>
          </div>
          <div className="profile-note-card">
            <span>핵심 욕망</span>
            <p>{character.desire || character.memo || "아직 핵심 욕망이 비어 있습니다."}</p>
          </div>
        </div>
      </div>

      <div className="character-meta-strip">
        <CharacterMetaTile label="첫 등장" value={appearances[0]?.number || character.firstEpisode || "-"} />
        <CharacterMetaTile label="등장 회차" value={appearances.length} />
        <CharacterMetaTile label="관련 떡밥" value={relatedForeshadows.length} />
        <CharacterMetaTile label="관계" value={relatedCharacters.length} />
      </div>

      <nav className="character-tabs" aria-label="캐릭터 상세 탭">
        {characterTabs.map((tab) => (
          <button className={activeTab === tab.id ? "active" : ""} key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="character-tab-body">
        {activeTab === "profile" ? (
          <div className="tab-panel">
            <InfoGrid items={[["별칭", character.alias], ["역할", character.role], ["중요도", character.importance], ["상태", character.status], ["소속", character.affiliation], ["직업", character.job]]} />
            <ReadSection title="한 줄 소개" body={character.memo} />
          </div>
        ) : null}
        {activeTab === "appearance" ? (
          <div className="tab-panel">
            <ReadSection title="외형 요약" body={character.appearanceSummary} />
            <InfoGrid items={[["신장", character.height], ["체형", character.bodyType], ["머리", character.hair], ["눈", character.eyes], ["복장", character.outfit], ["상징", character.symbolMotif]]} />
            <ReadSection title="첫인상" body={character.firstImpression} />
          </div>
        ) : null}
        {activeTab === "voice" ? (
          <div className="tab-panel">
            <ReadSection title="성격" body={character.personality} />
            <ReadSection title="말투" body={character.speechStyle} />
            <InfoGrid items={[["자주 쓰는 말", character.catchphrase], ["가치관", character.value], ["두려움", character.fear], ["약점", character.weakness], ["비밀", character.secret]]} />
          </div>
        ) : null}
        {activeTab === "arc" ? (
          <div className="tab-panel">
            <ReadSection title="상처" body={character.wound} />
            <ReadSection title="캐릭터 아크" body={character.characterArc || character.arc} />
            <InfoGrid items={[["시작 상태", character.startState], ["성장 계기", character.growthTrigger], ["핵심 선택", character.keyChoice], ["최종 상태", character.endState], ["작중 기능", character.narrativeFunction], ["독자 인상", character.readerImpression]]} />
          </div>
        ) : null}
        {activeTab === "relations" ? (
          <div className="tab-panel">
            <EntityLinks title="관계 인물" items={relatedCharacters} page="characters" navigateTo={navigateTo} />
            <EntityLinks title="관련 세력" items={relatedFactions} page="factions" navigateTo={navigateTo} />
            <ReadSection title="관계 메모" body={character.relationshipNotes} />
          </div>
        ) : null}
        {activeTab === "episodes" ? (
          <div className="tab-panel">
            <EpisodePills episodes={appearances} navigateTo={navigateTo} />
          </div>
        ) : null}
        {activeTab === "lore" ? (
          <div className="tab-panel">
            <EntityLinks title="관련 떡밥" items={relatedForeshadows} page="foreshadows" navigateTo={navigateTo} />
            <EntityLinks title="관련 세계관" items={relatedWorldItems} page="world" navigateTo={navigateTo} />
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function ForeshadowsPage({ project, selectedIds, setSelectedIds, navigateTo }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const stale = getStaleForeshadows(project);
  const filtered = project.foreshadows.filter((item) => {
    const q = query.trim().toLowerCase();
    return (statusFilter === "all" || item.status === statusFilter) && (!q || [item.title, item.description, item.memo, item.status].join(" ").toLowerCase().includes(q));
  });
  const selected = project.foreshadows.find((item) => item.id === selectedIds.foreshadows) ?? filtered[0] ?? project.foreshadows[0];

  return (
    <PageShell description="장기 연재의 약속과 회수 흐름을 추적합니다." eyebrow="Foreshadow" title="떡밥 추적">
      <Card className="filter-toolbar">
        <SearchInput value={query} onChange={setQuery} placeholder="떡밥 제목, 설명 검색" />
        <SelectField value={statusFilter} onChange={setStatusFilter}>
          <option value="all">전체 상태</option>
          {foreshadowStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </SelectField>
      </Card>
      {stale.length ? <div className="warning-band">20화 이상 방치된 미회수 떡밥 {stale.length}개가 있습니다.</div> : null}
      <section className="viewer-layout">
        <div className="viewer-list">
          {filtered.map((item) => (
            <button className={selected?.id === item.id ? "entity-card active" : "entity-card"} key={item.id} type="button" onClick={() => setSelectedIds((current) => ({ ...current, foreshadows: item.id }))}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <div className="chip-strip">
                <Badge tone={foreshadowTone(item.status)}>{item.status}</Badge>
                {stale.some((staleItem) => staleItem.id === item.id) ? <Badge tone="danger">장기 방치</Badge> : null}
              </div>
            </button>
          ))}
        </div>
        <ForeshadowDetail item={selected} project={project} navigateTo={navigateTo} />
      </section>
    </PageShell>
  );
}

function ForeshadowDetail({ item, navigateTo, project }) {
  if (!item) return <ViewerPanel title="떡밥 선택" description="왼쪽에서 떡밥을 선택하세요." />;
  const episodeNumbers = [
    item.introducedEpisode,
    ...(item.reinforcedEpisodes ?? []),
    item.partialPayoffEpisode,
    item.fullPayoffEpisode,
    ...project.episodes.filter((episode) => episode.foreshadowIds?.includes(item.id)).map((episode) => episode.number)
  ];

  return (
    <ViewerPanel title={item.title} description={item.description} actions={<Badge tone={foreshadowTone(item.status)}>{item.status}</Badge>}>
      <InfoGrid
        items={[
          ["첫 제시", episodeLabel(item.introducedEpisode)],
          ["강화 회차", (item.reinforcedEpisodes ?? []).map(episodeLabel).join(", ")],
          ["부분 회수", episodeLabel(item.partialPayoffEpisode)],
          ["완전 회수", episodeLabel(item.fullPayoffEpisode)],
          ["마지막 언급", episodeLabel(item.lastMentionEpisode)]
        ]}
      />
      <ReadSection title="메모" body={item.memo} />
      <LinkedEpisodeNumbers numbers={episodeNumbers} project={project} navigateTo={navigateTo} />
      <EntityLinks title="관련 캐릭터" items={idsToEntities(project.characters, item.relatedCharacterIds)} page="characters" navigateTo={navigateTo} />
      <EntityLinks title="관련 세력" items={idsToEntities(project.factions, item.relatedFactionIds)} page="factions" navigateTo={navigateTo} />
      <EntityLinks title="관련 세계관" items={idsToEntities(project.worldItems, item.relatedWorldItemIds)} page="world" navigateTo={navigateTo} />
    </ViewerPanel>
  );
}

function FactionsPage({ project, selectedIds, setSelectedIds, navigateTo }) {
  const [query, setQuery] = useState("");
  const filtered = project.factions.filter((faction) => {
    const q = query.trim().toLowerCase();
    return !q || [faction.name, faction.type, faction.goal, faction.conflictPoint, faction.narrativeUse].join(" ").toLowerCase().includes(q);
  });
  const selected = project.factions.find((faction) => faction.id === selectedIds.factions) ?? filtered[0] ?? project.factions[0];

  return (
    <PageShell description="세력의 목표, 충돌 지점, 서사 사용법을 비교합니다." eyebrow="Factions" title="세력 보기">
      <Card className="filter-toolbar"><SearchInput value={query} onChange={setQuery} placeholder="세력명, 목표, 갈등 검색" /></Card>
      <section className="viewer-layout">
        <div className="entity-grid">
          {filtered.map((faction) => (
            <button className={selected?.id === faction.id ? "faction-card active" : "faction-card"} key={faction.id} type="button" onClick={() => setSelectedIds((current) => ({ ...current, factions: faction.id }))}>
              <Badge tone="muted">{faction.type || "세력"}</Badge>
              <h3>{faction.name}</h3>
              <p>{faction.goal}</p>
              <small>{faction.conflictPoint}</small>
            </button>
          ))}
        </div>
        <FactionDetail faction={selected} project={project} navigateTo={navigateTo} />
      </section>
    </PageShell>
  );
}

function FactionDetail({ faction, project, navigateTo }) {
  if (!faction) return <ViewerPanel title="세력 선택" description="왼쪽에서 세력을 선택하세요." />;
  const relatedEpisodes = project.episodes.filter((episode) => episode.factionIds?.includes(faction.id) || faction.relatedEpisodeIds?.includes(episode.id));

  return (
    <ViewerPanel title={faction.name} description={faction.type || faction.status} actions={<Badge>{faction.status}</Badge>}>
      <ReadSection title="목표" body={faction.goal} />
      <ReadSection title="갈등 지점" body={faction.conflictPoint} />
      <ReadSection title="서사 사용법" body={faction.narrativeUse} />
      <ReadSection title="메모" body={faction.memo} />
      <EntityLinks title="관련 캐릭터" items={idsToEntities(project.characters, faction.relatedCharacterIds)} page="characters" navigateTo={navigateTo} />
      <EpisodePills episodes={relatedEpisodes} navigateTo={navigateTo} />
    </ViewerPanel>
  );
}

function WorldPage({ project, selectedIds, setSelectedIds, navigateTo }) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const filtered = project.worldItems.filter((item) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || [item.name, item.category, item.type, item.description, item.rule, item.narrativeUse, item.caution].join(" ").toLowerCase().includes(q);
    return matchesQuery && (categoryFilter === "all" || item.category === categoryFilter);
  });
  const selected = project.worldItems.find((item) => item.id === selectedIds.world) ?? filtered[0] ?? project.worldItems[0];

  return (
    <PageShell description="지역, 종족, 마법, 경제, 법칙을 설정집처럼 탐색합니다." eyebrow="World" title="세계관 / 규칙">
      <Card className="filter-toolbar">
        <SearchInput value={query} onChange={setQuery} placeholder="세계관 항목, 규칙, 주의점 검색" />
        <SelectField value={categoryFilter} onChange={setCategoryFilter}>
          <option value="all">전체 분류</option>
          {worldCategories.map((category) => <option key={category} value={category}>{category}</option>)}
        </SelectField>
      </Card>
      <section className="viewer-layout">
        <div className="entity-grid two">
          {filtered.map((item) => (
            <button className={selected?.id === item.id ? "world-card active" : "world-card"} key={item.id} type="button" onClick={() => setSelectedIds((current) => ({ ...current, world: item.id }))}>
              <Badge tone="info">{item.category}</Badge>
              <h3>{item.name}</h3>
              <p>{item.description || item.rule}</p>
            </button>
          ))}
        </div>
        <WorldDetail item={selected} project={project} navigateTo={navigateTo} />
      </section>
    </PageShell>
  );
}

function WorldDetail({ item, project, navigateTo }) {
  if (!item) return <ViewerPanel title="세계관 선택" description="왼쪽에서 항목을 선택하세요." />;
  const relatedEpisodes = project.episodes.filter((episode) => episode.worldItemIds?.includes(item.id) || item.relatedEpisodeIds?.includes(episode.id));

  return (
    <ViewerPanel title={item.name} description={`${item.category} · ${item.type}`} actions={<Badge tone="info">{item.category}</Badge>}>
      <ReadSection title="설명" body={item.description} />
      <ReadSection title="서사 사용법" body={item.narrativeUse} />
      <ReadSection title="규칙" body={item.rule} />
      <ReadSection title="대가 / 비용" body={item.cost} />
      <ReadSection title="주의해야 할 설정" body={item.caution} />
      <InfoGrid items={[["첫 언급", episodeLabel(item.firstMentionEpisode)]]} />
      <EntityLinks title="관련 캐릭터" items={idsToEntities(project.characters, item.relatedCharacterIds)} page="characters" navigateTo={navigateTo} />
      <EntityLinks title="관련 세력" items={idsToEntities(project.factions, item.relatedFactionIds)} page="factions" navigateTo={navigateTo} />
      <EpisodePills episodes={relatedEpisodes} navigateTo={navigateTo} />
    </ViewerPanel>
  );
}

function TimelinePage({ project, selectedIds, setSelectedIds, navigateTo }) {
  const [typeFilter, setTypeFilter] = useState("all");
  const filtered = project.timeline.filter((item) => typeFilter === "all" || item.type === typeFilter);
  const selected = project.timeline.find((item) => item.id === selectedIds.timeline) ?? filtered[0] ?? project.timeline[0];

  return (
    <PageShell description="세계관, 회차 진행, 인물 과거, 세력 사건을 시간순으로 봅니다." eyebrow="Timeline" title="연표">
      <Card className="filter-toolbar">
        <SelectField value={typeFilter} onChange={setTypeFilter}>
          <option value="all">전체 타입</option>
          {timelineTypes.map((type) => <option key={type} value={type}>{type}</option>)}
        </SelectField>
      </Card>
      <section className="viewer-layout">
        <div className="timeline-list">
          {filtered.map((item, index) => (
            <button className={selected?.id === item.id ? "timeline-item active" : "timeline-item"} key={item.id} type="button" onClick={() => setSelectedIds((current) => ({ ...current, timeline: item.id }))}>
              <span>{index + 1}</span>
              <div>
                <h3>{item.timeLabel}</h3>
                <p>{item.event}</p>
                <Badge tone="muted">{item.type}</Badge>
              </div>
            </button>
          ))}
        </div>
        <TimelineDetail item={selected} project={project} navigateTo={navigateTo} />
      </section>
    </PageShell>
  );
}

function TimelineDetail({ item, project, navigateTo }) {
  if (!item) return <ViewerPanel title="연표 선택" description="왼쪽에서 사건을 선택하세요." />;

  return (
    <ViewerPanel title={item.timeLabel} description={item.type} actions={<Badge>{item.type}</Badge>}>
      <ReadSection title="사건" body={item.event} />
      <ReadSection title="영향" body={item.impact} />
      <ReadSection title="훅" body={item.hook} />
      <EntityLinks title="관련 캐릭터" items={idsToEntities(project.characters, item.relatedCharacterIds)} page="characters" navigateTo={navigateTo} />
      <EntityLinks title="관련 세계관" items={idsToEntities(project.worldItems, item.relatedWorldItemIds)} page="world" navigateTo={navigateTo} />
      <EntityLinks title="관련 회차" items={idsToEntities(project.episodes, item.relatedEpisodeIds, (episode) => `${episode.number}화. ${episode.title}`)} page="episodes" navigateTo={navigateTo} />
    </ViewerPanel>
  );
}

function PacingPage({ project, navigateTo }) {
  const statusCounts = getEpisodeStatusCounts(project);
  const tagCounts = getTagCounts(project);
  const appearanceCounts = getCharacterAppearanceCounts(project).sort((a, b) => b.count - a.count);
  const foreshadowStats = getForeshadowStats(project);
  const staleForeshadows = getStaleForeshadows(project);
  const inactiveCharacters = getInactiveMainCharacters(project);
  const tagWarnings = getTagOveruseWarnings(project);
  const unplannedRanges = getUnplannedEpisodeRanges(project);

  return (
    <PageShell description="회차, 태그, 등장 인물, 떡밥 회수를 자동 분석합니다." eyebrow="Pacing" title="페이싱 분석">
      <div className="analysis-grid">
        <Card>
          <SectionTitle eyebrow="Status" title="회차 상태 분포" />
          <BarList items={Object.entries(statusCounts).map(([label, value]) => ({ label, value }))} total={project.episodes.length} />
        </Card>
        <Card>
          <SectionTitle eyebrow="Tags" title="태그 분포" />
          <BarList items={Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, value]) => ({ label, value }))} total={project.episodes.length} />
        </Card>
        <Card>
          <SectionTitle eyebrow="Characters" title="캐릭터 등장 빈도" />
          <BarList items={appearanceCounts.slice(0, 10).map(({ character, count }) => ({ label: character.name, value: count }))} total={Math.max(1, appearanceCounts[0]?.count ?? 1)} />
        </Card>
        <Card>
          <SectionTitle eyebrow="Foreshadow" title="떡밥 회수율" />
          <div className="stat-grid compact">
            <StatCard label="전체" value={foreshadowStats.total} />
            <StatCard label="미회수" tone="warning" value={foreshadowStats.unresolved} />
            <StatCard label="완전 회수" tone="success" value={foreshadowStats.resolved} />
          </div>
        </Card>
      </div>

      <section className="dashboard-layout">
        <Card>
          <SectionTitle eyebrow="Risks" title="경고 목록" />
          <WarningCards warnings={getDashboardWarnings(project)} />
        </Card>
        <Card>
          <SectionTitle eyebrow="Checks" title="상세 점검" />
          <MiniList title="오래 방치된 떡밥" items={staleForeshadows.map((item) => item.title)} />
          <MiniList title="최근 등장 없는 주요 인물" items={inactiveCharacters.map(({ character }) => character.name)} />
          <MiniList title="태그 반복 경고" items={tagWarnings.map((item) => `${item.tag} ${item.count}회`)} />
          <MiniList title="미기획 구간" items={unplannedRanges.map((range) => `${range.start}-${range.end}화`)} />
        </Card>
      </section>

      <Card>
        <SectionTitle eyebrow="Arc Focus" title="아크별 중심 인물" />
        <div className="arc-card-grid">
          {project.arcs.map((arc) => {
            const episodes = getArcEpisodes(project, arc);
            const characterIds = [...new Set(episodes.flatMap((episode) => episode.characterIds ?? []))];
            const characters = idsToEntities(project.characters, characterIds).slice(0, 5);
            return (
              <button className="arc-card" key={arc.id} type="button" onClick={() => episodes[0] && navigateTo({ page: "episodes", id: episodes[0].id })}>
                <span>{arc.range}</span>
                <strong>{arc.title}</strong>
                <p>{characters.map((character) => character.name).join(", ") || "중심 인물 미연결"}</p>
              </button>
            );
          })}
        </div>
      </Card>
    </PageShell>
  );
}

function BoardPage({ project, updateBoardColumns, navigateTo }) {
  function addCard(columnId) {
    const card = {
      id: makeId("board", "memo"),
      text: "새 메모",
      tags: [],
      episodeNumber: "",
      memo: "",
      createdAt: now(),
      updatedAt: now()
    };
    updateBoardColumns((columns) => columns.map((column) => (column.id === columnId ? { ...column, cards: [card, ...column.cards] } : column)));
  }

  function updateCard(columnId, cardId, patch) {
    updateBoardColumns((columns) =>
      columns.map((column) =>
        column.id === columnId
          ? { ...column, cards: column.cards.map((card) => (card.id === cardId ? { ...card, ...patch, updatedAt: now() } : card)) }
          : column
      )
    );
  }

  function deleteCard(columnId, cardId) {
    updateBoardColumns((columns) => columns.map((column) => (column.id === columnId ? { ...column, cards: column.cards.filter((card) => card.id !== cardId) } : column)));
  }

  return (
    <PageShell description="작품 원본 데이터는 data 파일에서 읽고, 이 보드의 개인 메모만 브라우저에 저장됩니다." eyebrow="Board" title="기획 보드 메모">
      <section className="board-grid">
        {project.boardColumns.map((column) => (
          <article className="board-column" key={column.id}>
            <div className="board-column-head">
              <h3>{column.title}</h3>
              <Badge>{column.cards.length}</Badge>
            </div>
            <Button tone="secondary" onClick={() => addCard(column.id)}>메모 추가</Button>
            <div className="board-card-list">
              {column.cards.map((card) => (
                <div className="board-card" key={card.id}>
                  <textarea value={card.text} onChange={(event) => updateCard(column.id, card.id, { text: event.target.value })} />
                  <input placeholder="태그: 예산, 감정" value={(card.tags ?? []).join(", ")} onChange={(event) => updateCard(column.id, card.id, { tags: parseTextList(event.target.value) })} />
                  <input placeholder="관련 회차 번호" value={card.episodeNumber} onChange={(event) => updateCard(column.id, card.id, { episodeNumber: event.target.value })} />
                  <div className="board-card-actions">
                    {card.episodeNumber ? (
                      <Button
                        tone="ghost"
                        onClick={() => {
                          const episode = project.episodes.find((item) => item.number === Number(card.episodeNumber));
                          if (episode) navigateTo({ page: "episodes", id: episode.id });
                        }}
                      >
                        회차 보기
                      </Button>
                    ) : null}
                    <Button tone="danger" onClick={() => deleteCard(column.id, card.id)}>삭제</Button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </PageShell>
  );
}

function SourcesPage({ project }) {
  return (
    <PageShell description="원문 파일은 공개 저장소에 올리지 않고, 분석 결과와 장편 구조에서 맡는 기능만 보여줍니다." eyebrow="Sources" title="원고 분석">
      <div className="source-grid">
        {project.sourceFiles.map((source) => (
          <Card className="source-card" key={source.id}>
            <Badge>{source.role}</Badge>
            <h3>{source.title}</h3>
            <p>{source.note}</p>
            <small>{source.file} · {source.phases} phases</small>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}

function SearchPage({ project, navigateTo }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => buildSearchResults(project, query), [project, query]);
  const grouped = results.reduce((result, item) => {
    result[item.type] = [...(result[item.type] ?? []), item];
    return result;
  }, {});

  return (
    <PageShell description="회차, 캐릭터, 세력, 세계관, 연표, 떡밥, 아크, 메모를 한 번에 검색합니다." eyebrow="Search" title="전체 검색">
      <Card><SearchInput value={query} onChange={setQuery} placeholder="검색어를 입력하세요" /></Card>
      <div className="search-groups">
        {Object.entries(grouped).map(([type, items]) => (
          <Card key={type}>
            <SectionTitle eyebrow={type} title={`${items.length}개 결과`} />
            <div className="stack-list">
              {items.map((item) => (
                <button className="list-row" key={item.id} type="button" onClick={() => navigateTo(item.target)}>
                  <span>{item.type}</span>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </button>
              ))}
            </div>
          </Card>
        ))}
        {query && !results.length ? <EmptyState title="검색 결과가 없습니다" description="다른 단어로 검색해 보세요." /> : null}
      </div>
    </PageShell>
  );
}

function PageShell({ actions, children, className = "", description, eyebrow, title }) {
  return (
    <div className={`page-stack ${className}`}>
      <header className="page-header">
        <div className="page-title-block">
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {actions ? <div className="page-actions">{actions}</div> : null}
      </header>
      {children}
    </div>
  );
}

function ViewerPanel({ actions, children, description, title }) {
  return (
    <aside className="viewer-panel">
      <div className="viewer-panel-head">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        {actions ? <div>{actions}</div> : null}
      </div>
      <div className="viewer-panel-body">{children}</div>
    </aside>
  );
}

function Card({ children, className = "" }) {
  return <article className={`card ${className}`}>{children}</article>;
}

function Button({ children, onClick, tone = "primary", type = "button" }) {
  return <button className={`button ${tone}`} type={type} onClick={onClick}>{children}</button>;
}

function Badge({ children, tone = "default" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function StatCard({ label, tone = "default", value }) {
  return (
    <article className={`stat-card ${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function SectionTitle({ eyebrow, title }) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h3>{title}</h3>
    </div>
  );
}

function EmptyState({ description, title }) {
  return (
    <div className="empty-state">
      <span className="empty-mark">ST</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function SearchInput({ onChange, placeholder, value }) {
  return (
    <label className="field">
      <span>검색</span>
      <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectField({ children, label, onChange, value }) {
  return (
    <label className="field">
      {label ? <span>{label}</span> : null}
      <select value={value ?? ""} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}

function EpisodeMiniMap({ episodes, onSelect, selectedId }) {
  return (
    <div className="minimap-wrap">
      <div className="episode-minimap">
        {[...episodes].sort((a, b) => a.number - b.number).map((episode) => (
          <button
            aria-label={`${episode.number}화 ${episode.status}`}
            className={selectedId === episode.id ? `mini-cell ${statusClass(episode.status)} active` : `mini-cell ${statusClass(episode.status)}`}
            key={episode.id}
            title={`${episode.number}화 · ${episode.title} · ${episode.status}`}
            type="button"
            onClick={() => onSelect(episode)}
          >
            {episode.number}
          </button>
        ))}
      </div>
      <div className="minimap-legend" aria-label="회차 상태 범례">
        {episodeStatuses.map((status) => (
          <span key={status}>
            <i className={`mini-dot ${statusClass(status)}`} />
            {status}
          </span>
        ))}
      </div>
    </div>
  );
}

function WarningCards({ warnings }) {
  if (!warnings.length) return <EmptyState title="경고가 없습니다" description="현재 구조상 큰 리스크가 없습니다." />;

  return (
    <div className="warning-grid">
      {warnings.map((warning) => (
        <div className={`warning-card ${warning.severity}`} key={warning.id}>
          <strong>{warning.title}</strong>
          <p>{warning.message}</p>
        </div>
      ))}
    </div>
  );
}

function ReadSection({ body, title }) {
  if (!body) return null;
  return (
    <section className="read-section">
      <h4>{title}</h4>
      <p>{body}</p>
    </section>
  );
}

function InfoGrid({ items }) {
  const filtered = items.filter(([, value]) => value !== undefined && value !== null && value !== "");
  if (!filtered.length) return null;
  return (
    <dl className="info-grid">
      {filtered.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function EntityLinks({ items, navigateTo, page, title }) {
  if (!items?.length) return <MiniList title={title} items={["연결 데이터가 없습니다."]} />;
  return (
    <div className="entity-links">
      <span>{title}</span>
      <div>
        {items.map((item) => (
          <button key={item.id} type="button" onClick={() => navigateTo({ page, id: item.id })}>
            {item.label ?? item.name ?? item.title}
          </button>
        ))}
      </div>
    </div>
  );
}

function EpisodePills({ episodes, navigateTo }) {
  if (!episodes?.length) return <MiniList title="관련 회차" items={["연결된 회차가 없습니다."]} />;
  return (
    <div className="episode-pill-grid">
      {episodes.map((episode) => (
        <button key={episode.id} type="button" onClick={() => navigateTo({ page: "episodes", id: episode.id })}>
          <strong>{episode.number}화</strong>
          <span>{episode.title}</span>
        </button>
      ))}
    </div>
  );
}

function LinkedEpisodeNumbers({ navigateTo, numbers, project }) {
  const episodes = [...new Set(numbers.filter(Boolean).map(Number))]
    .sort((a, b) => a - b)
    .map((number) => project.episodes.find((episode) => Number(episode.number) === number))
    .filter(Boolean);
  return <EpisodePills episodes={episodes} navigateTo={navigateTo} />;
}

function MiniList({ items, title }) {
  const list = items?.length ? items : ["없음"];
  return (
    <div className="mini-list">
      <span>{title}</span>
      <ul>
        {list.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
      </ul>
    </div>
  );
}

function TagList({ compact = false, tags = [] }) {
  if (!tags?.length) return null;
  return (
    <div className={compact ? "tag-row compact" : "tag-row"}>
      {tags.map((tag) => <span key={tag}>{tag}</span>)}
    </div>
  );
}

function BarList({ items, total }) {
  return (
    <div className="bar-list">
      {items.map((item) => (
        <div key={item.label}>
          <span>{item.label}</span>
          <b style={{ width: `${Math.min(100, Math.round((item.value / Math.max(1, total)) * 100))}%` }} />
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function CharacterAvatar({ character, size = "card" }) {
  const initial = (character.name || "?").trim().slice(0, 1);
  const avatar = character.avatar || character.avatarDataUrl;

  return (
    <div className={`character-avatar ${size}`}>
      {avatar ? (
        <img alt={`${character.name} 프로필`} src={avatar} />
      ) : (
        <div className="avatar-fallback">
          <span>{initial}</span>
          <small>{character.symbolMotif || character.importance || "ST"}</small>
        </div>
      )}
    </div>
  );
}

function CharacterMetaTile({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getArcEpisodes(project, arc) {
  return project.episodes.filter((episode) => episode.arcId === arc.id || episode.arc === arc.title);
}

function idsToEntities(collection = [], ids = [], labeler) {
  return (ids ?? [])
    .map((id) => {
      const item = collection.find((entity) => entity.id === id);
      return item ? { ...item, label: labeler ? labeler(item) : item.name ?? item.title } : null;
    })
    .filter(Boolean);
}

function episodeLabel(value) {
  return value ? `${value}화` : "";
}

function parseTextList(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function statusClass(status) {
  const classes = {
    미기획: "unplanned",
    기획중: "planning",
    초안완료: "draft",
    수정중: "revision",
    완료: "done"
  };
  return classes[status] ?? "unplanned";
}

function statusTone(status) {
  const tones = {
    미기획: "muted",
    기획중: "warning",
    초안완료: "info",
    수정중: "accent",
    완료: "success"
  };
  return tones[status] ?? "default";
}

function foreshadowTone(status) {
  if (status === "완전 회수") return "success";
  if (status === "폐기") return "muted";
  if (status === "부분 회수") return "warning";
  return "danger";
}

function importanceTone(importance) {
  if (importance === "주연") return "accent";
  if (importance === "빌런") return "danger";
  if (importance === "조력자") return "success";
  if (importance === "단역") return "muted";
  return "info";
}

function characterStatusTone(status) {
  if (status === "생존") return "success";
  if (status === "사망" || status === "배신") return "danger";
  if (status === "실종" || status === "봉인") return "warning";
  if (status === "퇴장") return "muted";
  return "info";
}
