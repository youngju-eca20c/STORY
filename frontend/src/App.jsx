import { useEffect, useMemo, useRef, useState } from "react";

import { appMeta, storyProjects } from "./data/storyData";
import {
  getCharacterAppearanceCounts,
  getDashboardWarnings,
  getEpisodeProgress,
  getEpisodeStatusCounts,
  getForeshadowStats,
  getInactiveMainCharacters,
  getStaleForeshadows,
  getTagCounts
} from "./utils/analytics";
import {
  characterImportance,
  episodeStatuses,
  episodeTags,
  foreshadowStatuses,
  makeId,
  timelineTypes,
  worldCategories
} from "./utils/normalize";
import { buildSearchResults } from "./utils/search";
import {
  downloadJson,
  exportWorkspaceData,
  importWorkspaceData,
  loadWorkspaceData,
  resetWorkspaceData,
  saveWorkspaceData
} from "./utils/storage";

const pages = [
  { id: "dashboard", label: "대시보드", short: "DB" },
  { id: "episodes", label: "회차 관리", short: "EP" },
  { id: "foreshadows", label: "떡밥", short: "FB" },
  { id: "characters", label: "캐릭터", short: "CH" },
  { id: "factions", label: "세력", short: "FC" },
  { id: "world", label: "세계관", short: "WD" },
  { id: "timeline", label: "연표", short: "TL" },
  { id: "board", label: "기획 보드", short: "BD" },
  { id: "sources", label: "원고 분석", short: "SC" },
  { id: "search", label: "전체 검색", short: "SR" }
];

const now = () => new Date().toISOString();

export default function App() {
  const [workspace, setWorkspace] = useState(loadWorkspaceData);
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState(() => workspace.projects[0]?.id ?? "");
  const [selectedIds, setSelectedIds] = useState({});
  const [toast, setToast] = useState("");
  const importInputRef = useRef(null);

  const project = useMemo(
    () => workspace.projects.find((item) => item.id === selectedProjectId) ?? workspace.projects[0],
    [selectedProjectId, workspace.projects]
  );
  const disabledStorySlots = storyProjects.filter((story) => story.disabled);

  useEffect(() => {
    if (!project && workspace.projects[0]) {
      setSelectedProjectId(workspace.projects[0].id);
    }
  }, [project, workspace.projects]);

  useEffect(() => {
    saveWorkspaceData(workspace);
  }, [workspace]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activePage, selectedProjectId]);

  function updateWorkspace(updater) {
    setWorkspace((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      return { ...next, updatedAt: now() };
    });
  }

  function updateProject(updater) {
    updateWorkspace((current) => ({
      ...current,
      projects: current.projects.map((item) => {
        if (item.id !== project.id) return item;
        const nextProject = typeof updater === "function" ? updater(item) : { ...item, ...updater };
        return { ...nextProject, updatedAt: now() };
      })
    }));
  }

  function updateCollectionItem(collection, id, patch) {
    updateProject((current) => ({
      ...current,
      [collection]: current[collection].map((item) =>
        item.id === id ? { ...item, ...patch, updatedAt: now() } : item
      )
    }));
  }

  function addCollectionItem(collection, item, page) {
    updateProject((current) => ({
      ...current,
      [collection]: [item, ...current[collection]]
    }));
    setSelectedIds((current) => ({ ...current, [page ?? collection]: item.id }));
    setToast("새 항목을 추가했습니다.");
  }

  function deleteCollectionItem(collection, id, page) {
    if (!window.confirm("이 항목을 삭제할까요?")) return;
    updateProject((current) => ({
      ...current,
      [collection]: current[collection].filter((item) => item.id !== id)
    }));
    setSelectedIds((current) => ({ ...current, [page ?? collection]: "" }));
    setToast("삭제했습니다.");
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

  function handleReset() {
    if (!window.confirm("localStorage에 저장된 수정 데이터를 지우고 샘플 데이터로 초기화할까요?")) return;
    const reset = resetWorkspaceData();
    setWorkspace(reset);
    setSelectedProjectId(reset.projects[0]?.id ?? "");
    setSelectedIds({});
    setToast("샘플 데이터로 초기화했습니다.");
  }

  function handleExport() {
    const content = exportWorkspaceData(workspace, project.id);
    downloadJson(`${project.meta.title}-story200.json`, content);
    setToast("현재 작품 JSON을 내보냈습니다.");
  }

  async function handleImport(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const content = await file.text();
      const parsed = JSON.parse(content);
      const importedId = parsed?.project?.id ?? parsed?.id;
      const nextWorkspace = importWorkspaceData(workspace, parsed);
      setWorkspace(nextWorkspace);
      if (importedId) setSelectedProjectId(importedId);
      setToast("JSON 데이터를 가져왔습니다.");
    } catch (error) {
      setToast(error.message || "JSON 가져오기에 실패했습니다.");
    }
  }

  if (!project) {
    return <EmptyState title="작품 데이터가 없습니다" description="샘플 데이터로 초기화해 주세요." />;
  }

  const pageProps = {
    project,
    selectedIds,
    setSelectedIds,
    updateProject,
    updateCollectionItem,
    addCollectionItem,
    deleteCollectionItem,
    navigateTo
  };

  return (
    <main className="app-shell" style={{ "--story-accent": project.meta.accent }}>
      <Sidebar
        activePage={activePage}
        disabledStorySlots={disabledStorySlots}
        importInputRef={importInputRef}
        onExport={handleExport}
        onImport={handleImport}
        onReset={handleReset}
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
        {activePage === "board" ? <BoardPage {...pageProps} /> : null}
        {activePage === "sources" ? <SourcesPage {...pageProps} /> : null}
        {activePage === "search" ? <SearchPage {...pageProps} /> : null}
      </section>

      {toast ? <div className="toast">{toast}</div> : null}
    </main>
  );
}

function Sidebar({
  activePage,
  disabledStorySlots,
  importInputRef,
  onExport,
  onImport,
  onReset,
  onSelectPage,
  onSelectProject,
  pages,
  project,
  projects
}) {
  return (
    <aside className="sidebar" aria-label="스토리 작업실 메뉴">
      <div className="brand-block">
        <span className="brand-mark">S2</span>
        <div>
          <h1>{appMeta.name}</h1>
          <p>장편 웹소설 기획실</p>
        </div>
      </div>

      <section className="sidebar-section">
        <p className="sidebar-label">작품</p>
        <div className="story-switcher">
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
          {disabledStorySlots.map((slot) => (
            <button className="story-option disabled" disabled key={slot.id} type="button">
              <strong>{slot.title}</strong>
              <span>{slot.status}</span>
            </button>
          ))}
        </div>
      </section>

      <nav className="tab-list">
        {pages.map((page) => (
          <button
            className={activePage === page.id ? "tab-button active" : "tab-button"}
            key={page.id}
            type="button"
            onClick={() => onSelectPage(page.id)}
          >
            <span className="tab-glyph">{page.short}</span>
            <span>{page.label}</span>
          </button>
        ))}
      </nav>

      <section className="sidebar-section data-actions">
        <p className="sidebar-label">데이터 관리</p>
        <Button tone="ghost" onClick={onExport}>
          JSON 내보내기
        </Button>
        <Button tone="ghost" onClick={() => importInputRef.current?.click()}>
          JSON 가져오기
        </Button>
        <Button tone="danger" onClick={onReset}>
          샘플 데이터로 초기화
        </Button>
        <input accept="application/json" className="hidden-input" ref={importInputRef} type="file" onChange={onImport} />
      </section>
    </aside>
  );
}

function DashboardPage({ project, updateProject, navigateTo }) {
  const statusCounts = getEpisodeStatusCounts(project);
  const progress = getEpisodeProgress(project);
  const foreshadowStats = getForeshadowStats(project);
  const warnings = getDashboardWarnings(project);
  const recentEpisodes = [...project.episodes]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);

  return (
    <PageShell
      actions={
        <>
          <Button onClick={() => navigateTo({ page: "episodes", id: project.episodes[0]?.id })}>회차 열기</Button>
          <Button tone="secondary" onClick={() => navigateTo({ page: "foreshadows", id: project.foreshadows[0]?.id })}>
            떡밥 점검
          </Button>
        </>
      }
      description={project.meta.logline}
      eyebrow="Workspace"
      title={project.meta.title}
    >
      <section className="hero-summary">
        <div>
          <Badge>{project.meta.genre}</Badge>
          <Badge>{project.meta.targetEpisodes}화 목표</Badge>
          <Badge tone="accent">{project.meta.status}</Badge>
        </div>
        <div className="progress-panel">
          <span>전체 기획 진행률</span>
          <strong>{progress}%</strong>
          <div className="progress-track">
            <i style={{ width: `${progress}%` }} />
          </div>
        </div>
      </section>

      <section className="stat-grid">
        <StatCard label="완료" value={statusCounts.완료 ?? 0} />
        <StatCard label="기획중" value={statusCounts.기획중 ?? 0} />
        <StatCard label="미기획" value={statusCounts.미기획 ?? 0} />
        <StatCard label="캐릭터" value={project.characters.length} />
        <StatCard label="세력" value={project.factions.length} />
        <StatCard label="세계관" value={project.worldItems.length} />
        <StatCard label="떡밥" value={foreshadowStats.total} />
        <StatCard label="미회수" value={foreshadowStats.unresolved} tone="danger" />
      </section>

      <section className="dashboard-layout">
        <Card className="span-2">
          <SectionTitle eyebrow="Warnings" title="작가용 경고" />
          <WarningCards warnings={warnings} />
        </Card>

        <Card>
          <SectionTitle eyebrow="Today" title="오늘의 작업 메모" />
          <textarea
            className="memo-area"
            placeholder="오늘 손볼 회차, 회수할 떡밥, 수정할 캐릭터 감정을 적어두세요."
            value={project.dailyMemo ?? ""}
            onChange={(event) => updateProject({ dailyMemo: event.target.value })}
          />
        </Card>
      </section>

      <Card>
        <SectionTitle eyebrow="Episode map" title="1-200화 미니맵" />
        <EpisodeMiniMap episodes={project.episodes} onSelect={(episode) => navigateTo({ page: "episodes", id: episode.id })} />
      </Card>

      <section className="dashboard-layout">
        <Card>
          <SectionTitle eyebrow="Recent" title="최근 수정 회차" />
          <div className="stack-list">
            {recentEpisodes.map((episode) => (
              <button className="list-row" key={episode.id} type="button" onClick={() => navigateTo({ page: "episodes", id: episode.id })}>
                <span>{episode.number}화</span>
                <strong>{episode.title}</strong>
                <Badge tone={statusTone(episode.status)}>{episode.status}</Badge>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle eyebrow="Structure" title="작품의 척추" />
          <ol className="number-list">
            {project.storySpine.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </Card>
      </section>
    </PageShell>
  );
}

function EpisodesPage({ project, selectedIds, setSelectedIds, updateCollectionItem, addCollectionItem, deleteCollectionItem }) {
  const [query, setQuery] = useState("");
  const [arcFilter, setArcFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const selectedEpisode =
    project.episodes.find((episode) => episode.id === selectedIds.episodes) ??
    [...project.episodes].sort((a, b) => a.number - b.number)[0];

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return [...project.episodes]
      .sort((a, b) => a.number - b.number)
      .filter((episode) => arcFilter === "all" || episode.arcId === arcFilter || episode.arc === arcFilter)
      .filter((episode) => statusFilter === "all" || episode.status === statusFilter)
      .filter((episode) => tagFilter === "all" || episode.tags?.includes(tagFilter))
      .filter((episode) => {
        if (!normalized) return true;
        return [episode.title, episode.purpose, episode.summary, episode.detail, episode.hook, episode.memo]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      });
  }, [arcFilter, project.episodes, query, statusFilter, tagFilter]);

  function addEpisode() {
    const number = Math.max(0, ...project.episodes.map((episode) => Number(episode.number) || 0)) + 1;
    addCollectionItem(
      "episodes",
      {
        id: makeId("episode", String(number).padStart(3, "0")),
        number,
        title: "새 회차",
        arc: project.arcs[0]?.title ?? "",
        arcId: project.arcs[0]?.id ?? "",
        part: project.arcs[0]?.act ?? "",
        purpose: "",
        focus: "",
        sourceType: "직접 추가",
        summary: "",
        detail: "",
        status: "미기획",
        tags: [],
        characterIds: [],
        factionIds: [],
        worldItemIds: [],
        foreshadowIds: [],
        hook: "",
        memo: "",
        updatedAt: now()
      },
      "episodes"
    );
  }

  return (
    <PageShell
      actions={<Button onClick={addEpisode}>회차 추가</Button>}
      description="검색, 필터, 미니맵, 상세 편집으로 200화 운영 상태를 관리합니다."
      eyebrow="Episodes"
      title="회차 관리"
    >
      <Card>
        <EpisodeMiniMap
          episodes={project.episodes}
          selectedId={selectedEpisode?.id}
          onSelect={(episode) => setSelectedIds((current) => ({ ...current, episodes: episode.id }))}
        />
      </Card>

      <section className="tool-layout">
        <div className="tool-main">
          <Card>
            <div className="filter-grid four">
              <SearchInput value={query} onChange={setQuery} placeholder="회차 제목, 목적, 요약 검색" />
              <SelectField value={arcFilter} onChange={setArcFilter}>
                <option value="all">전체 아크</option>
                {project.arcs.map((arc) => (
                  <option key={arc.id} value={arc.id}>
                    {arc.range} {arc.title}
                  </option>
                ))}
              </SelectField>
              <SelectField value={statusFilter} onChange={setStatusFilter}>
                <option value="all">전체 상태</option>
                {episodeStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </SelectField>
              <SelectField value={tagFilter} onChange={setTagFilter}>
                <option value="all">전체 태그</option>
                {episodeTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </SelectField>
            </div>
          </Card>

          <div className="episode-list">
            {filtered.map((episode) => (
              <button
                className={selectedEpisode?.id === episode.id ? "episode-row active" : "episode-row"}
                key={episode.id}
                type="button"
                onClick={() => setSelectedIds((current) => ({ ...current, episodes: episode.id }))}
              >
                <span className="episode-number">{episode.number}</span>
                <div>
                  <strong>{episode.title}</strong>
                  <p>{episode.summary || episode.purpose || episode.arc}</p>
                  <div className="chip-strip">
                    <Badge tone={statusTone(episode.status)}>{episode.status}</Badge>
                    {(episode.tags ?? []).slice(0, 3).map((tag) => (
                      <Badge key={tag} tone="muted">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <EpisodeEditor
          episode={selectedEpisode}
          project={project}
          onDelete={() => deleteCollectionItem("episodes", selectedEpisode.id, "episodes")}
          onUpdate={(patch) => updateCollectionItem("episodes", selectedEpisode.id, patch)}
        />
      </section>
    </PageShell>
  );
}

function EpisodeEditor({ episode, project, onDelete, onUpdate }) {
  if (!episode) {
    return <EditorShell title="회차 선택" description="왼쪽에서 회차를 선택하세요." />;
  }

  const selectedArc = project.arcs.find((arc) => arc.id === episode.arcId);

  function updateArc(arcId) {
    const arc = project.arcs.find((item) => item.id === arcId);
    onUpdate({ arcId, arc: arc?.title ?? "", part: arc?.act ?? episode.part });
  }

  return (
    <EditorShell
      actions={<Button tone="danger" onClick={onDelete}>삭제</Button>}
      description={`${episode.number}화 · ${selectedArc?.title ?? episode.arc}`}
      title="회차 상세 편집"
    >
      <div className="editor-grid">
        <TextField label="회차 번호" type="number" value={episode.number} onChange={(value) => onUpdate({ number: Number(value) })} />
        <SelectField label="상태" value={episode.status} onChange={(value) => onUpdate({ status: value })}>
          {episodeStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </SelectField>
      </div>
      <TextField label="제목" value={episode.title} onChange={(value) => onUpdate({ title: value })} />
      <SelectField label="아크" value={episode.arcId} onChange={updateArc}>
        <option value="">아크 없음</option>
        {project.arcs.map((arc) => (
          <option key={arc.id} value={arc.id}>
            {arc.range} {arc.title}
          </option>
        ))}
      </SelectField>
      <div className="editor-grid">
        <TextField label="파트" value={episode.part} onChange={(value) => onUpdate({ part: value })} />
        <TextField label="중심 요소" value={episode.focus} onChange={(value) => onUpdate({ focus: value })} />
      </div>
      <TextField label="회차 목적" value={episode.purpose} onChange={(value) => onUpdate({ purpose: value })} />
      <TextArea label="요약" value={episode.summary} onChange={(value) => onUpdate({ summary: value })} />
      <TextArea label="상세 줄거리" rows={6} value={episode.detail} onChange={(value) => onUpdate({ detail: value })} />
      <TextArea label="후킹" value={episode.hook} onChange={(value) => onUpdate({ hook: value })} />
      <TextArea label="메모" value={episode.memo} onChange={(value) => onUpdate({ memo: value })} />
      <CheckGroup label="태그" options={episodeTags.map((tag) => ({ id: tag, name: tag }))} values={episode.tags} onChange={(tags) => onUpdate({ tags })} />
      <CheckGroup label="관련 캐릭터" options={project.characters} values={episode.characterIds} onChange={(characterIds) => onUpdate({ characterIds })} />
      <CheckGroup label="관련 세력" options={project.factions} values={episode.factionIds} onChange={(factionIds) => onUpdate({ factionIds })} />
      <CheckGroup label="관련 세계관" options={project.worldItems} values={episode.worldItemIds} onChange={(worldItemIds) => onUpdate({ worldItemIds })} />
      <CheckGroup label="관련 떡밥" options={project.foreshadows} values={episode.foreshadowIds} onChange={(foreshadowIds) => onUpdate({ foreshadowIds })} />
    </EditorShell>
  );
}

function ForeshadowsPage({ project, selectedIds, setSelectedIds, updateCollectionItem, addCollectionItem, deleteCollectionItem, navigateTo }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const selected =
    project.foreshadows.find((item) => item.id === selectedIds.foreshadows) ?? project.foreshadows[0];
  const stale = getStaleForeshadows(project);
  const filtered = project.foreshadows.filter((item) => statusFilter === "all" || item.status === statusFilter);

  function addForeshadow() {
    addCollectionItem(
      "foreshadows",
      {
        id: makeId("foreshadow", "new"),
        title: "새 떡밥",
        description: "",
        introducedEpisode: "",
        reinforcedEpisodes: [],
        partialPayoffEpisode: "",
        fullPayoffEpisode: "",
        status: "미회수",
        relatedCharacterIds: [],
        relatedFactionIds: [],
        relatedWorldItemIds: [],
        memo: "",
        lastMentionEpisode: "",
        updatedAt: now()
      },
      "foreshadows"
    );
  }

  return (
    <PageShell
      actions={<Button onClick={addForeshadow}>떡밥 추가</Button>}
      description="장기연재에서 제시, 강화, 부분 회수, 완전 회수를 추적합니다."
      eyebrow="Foreshadow"
      title="떡밥 관리"
    >
      {stale.length ? (
        <div className="warning-band">
          20화 이상 언급되지 않은 미회수 떡밥 {stale.length}개가 있습니다.
        </div>
      ) : null}

      <section className="tool-layout">
        <div className="tool-main">
          <Card>
            <SelectField label="상태 필터" value={statusFilter} onChange={setStatusFilter}>
              <option value="all">전체 상태</option>
              {foreshadowStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </SelectField>
          </Card>
          <div className="card-list">
            {filtered.map((item) => (
              <button
                className={selected?.id === item.id ? "entity-card active" : "entity-card"}
                key={item.id}
                type="button"
                onClick={() => setSelectedIds((current) => ({ ...current, foreshadows: item.id }))}
              >
                <div>
                  <Badge tone={foreshadowTone(item.status)}>{item.status}</Badge>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                <small>첫 제시 {item.introducedEpisode || "-"}화 · 완전 회수 {item.fullPayoffEpisode || "-"}화</small>
              </button>
            ))}
          </div>
        </div>

        <ForeshadowEditor
          foreshadow={selected}
          project={project}
          navigateTo={navigateTo}
          onDelete={() => deleteCollectionItem("foreshadows", selected.id, "foreshadows")}
          onUpdate={(patch) => updateCollectionItem("foreshadows", selected.id, patch)}
        />
      </section>
    </PageShell>
  );
}

function ForeshadowEditor({ foreshadow, navigateTo, project, onDelete, onUpdate }) {
  if (!foreshadow) return <EditorShell title="떡밥 선택" description="왼쪽에서 떡밥을 선택하세요." />;

  const relatedEpisodeNumbers = getForeshadowEpisodes(project, foreshadow);

  return (
    <EditorShell
      actions={<Button tone="danger" onClick={onDelete}>삭제</Button>}
      description="떡밥의 제시와 회수 상태를 관리합니다."
      title="떡밥 상세 편집"
    >
      <TextField label="제목" value={foreshadow.title} onChange={(value) => onUpdate({ title: value })} />
      <SelectField label="상태" value={foreshadow.status} onChange={(value) => onUpdate({ status: value })}>
        {foreshadowStatuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </SelectField>
      <TextArea label="설명" value={foreshadow.description} onChange={(value) => onUpdate({ description: value })} />
      <div className="editor-grid">
        <TextField label="첫 제시 화" type="number" value={foreshadow.introducedEpisode} onChange={(value) => onUpdate({ introducedEpisode: toNumberOrBlank(value) })} />
        <TextField label="부분 회수 화" type="number" value={foreshadow.partialPayoffEpisode} onChange={(value) => onUpdate({ partialPayoffEpisode: toNumberOrBlank(value) })} />
      </div>
      <div className="editor-grid">
        <TextField label="완전 회수 화" type="number" value={foreshadow.fullPayoffEpisode} onChange={(value) => onUpdate({ fullPayoffEpisode: toNumberOrBlank(value) })} />
        <TextField label="마지막 언급 화" type="number" value={foreshadow.lastMentionEpisode} onChange={(value) => onUpdate({ lastMentionEpisode: toNumberOrBlank(value) })} />
      </div>
      <TextField
        label="강화 회차"
        placeholder="예: 12, 27, 43"
        value={(foreshadow.reinforcedEpisodes ?? []).join(", ")}
        onChange={(value) => onUpdate({ reinforcedEpisodes: parseNumberList(value) })}
      />
      <CheckGroup label="관련 캐릭터" options={project.characters} values={foreshadow.relatedCharacterIds} onChange={(relatedCharacterIds) => onUpdate({ relatedCharacterIds })} />
      <CheckGroup label="관련 세력" options={project.factions} values={foreshadow.relatedFactionIds} onChange={(relatedFactionIds) => onUpdate({ relatedFactionIds })} />
      <CheckGroup label="관련 세계관" options={project.worldItems} values={foreshadow.relatedWorldItemIds} onChange={(relatedWorldItemIds) => onUpdate({ relatedWorldItemIds })} />
      <TextArea label="메모" value={foreshadow.memo} onChange={(value) => onUpdate({ memo: value })} />
      <LinkedEpisodeButtons numbers={relatedEpisodeNumbers} project={project} navigateTo={navigateTo} />
    </EditorShell>
  );
}

function CharactersPage({ project, selectedIds, setSelectedIds, updateCollectionItem, addCollectionItem, deleteCollectionItem, navigateTo }) {
  const [query, setQuery] = useState("");
  const [importanceFilter, setImportanceFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const appearances = getCharacterAppearanceCounts(project);
  const inactive = getInactiveMainCharacters(project);
  const tags = [...new Set(project.characters.flatMap((character) => character.tags ?? []))];
  const selected = project.characters.find((character) => character.id === selectedIds.characters) ?? project.characters[0];

  const filtered = project.characters.filter((character) => {
    const normalized = query.trim().toLowerCase();
    const matchesQuery = !normalized || [character.name, character.role, character.arc, ...(character.tags ?? [])].join(" ").toLowerCase().includes(normalized);
    const matchesImportance = importanceFilter === "all" || character.importance === importanceFilter;
    const matchesTag = tagFilter === "all" || character.tags?.includes(tagFilter);
    return matchesQuery && matchesImportance && matchesTag;
  });

  function addCharacter() {
    addCollectionItem(
      "characters",
      {
        id: makeId("char", "new"),
        name: "새 캐릭터",
        role: "",
        status: "",
        wound: "",
        desire: "",
        power: "",
        arc: "",
        tags: [],
        spec: {},
        relationshipNotes: "",
        firstEpisode: "",
        lastEpisode: "",
        importance: "조연",
        relatedForeshadowIds: [],
        memo: "",
        updatedAt: now()
      },
      "characters"
    );
  }

  return (
    <PageShell
      actions={<Button onClick={addCharacter}>캐릭터 추가</Button>}
      description="등장 회차, 중요도, 관계, 떡밥 연결까지 함께 관리합니다."
      eyebrow="Characters"
      title="캐릭터 관리"
    >
      {inactive.length ? <div className="warning-band">최근 20화 이상 등장하지 않은 주요 캐릭터 {inactive.length}명이 있습니다.</div> : null}
      <section className="tool-layout">
        <div className="tool-main">
          <Card>
            <div className="filter-grid three">
              <SearchInput value={query} onChange={setQuery} placeholder="캐릭터 이름, 태그, 아크 검색" />
              <SelectField value={importanceFilter} onChange={setImportanceFilter}>
                <option value="all">전체 중요도</option>
                {characterImportance.map((importance) => (
                  <option key={importance} value={importance}>
                    {importance}
                  </option>
                ))}
              </SelectField>
              <SelectField value={tagFilter} onChange={setTagFilter}>
                <option value="all">전체 태그</option>
                {tags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </SelectField>
            </div>
          </Card>
          <div className="entity-grid">
            {filtered.map((character) => {
              const appearance = appearances.find((item) => item.character.id === character.id);
              return (
                <button
                  className={selected?.id === character.id ? "character-card active" : "character-card"}
                  key={character.id}
                  type="button"
                  onClick={() => setSelectedIds((current) => ({ ...current, characters: character.id }))}
                >
                  <div className="portrait-panel">
                    <span>{character.name.slice(0, 1)}</span>
                    <p>{character.spec?.appearance || character.role}</p>
                  </div>
                  <h3>{character.name}</h3>
                  <p>{character.role}</p>
                  <div className="chip-strip">
                    <Badge tone="accent">{character.importance}</Badge>
                    <Badge tone="muted">등장 {appearance?.count ?? 0}회</Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <CharacterEditor
          character={selected}
          navigateTo={navigateTo}
          project={project}
          onDelete={() => deleteCollectionItem("characters", selected.id, "characters")}
          onUpdate={(patch) => updateCollectionItem("characters", selected.id, patch)}
        />
      </section>
    </PageShell>
  );
}

function CharacterEditor({ character, navigateTo, project, onDelete, onUpdate }) {
  if (!character) return <EditorShell title="캐릭터 선택" description="왼쪽에서 캐릭터를 선택하세요." />;

  const appearanceEpisodes = project.episodes.filter((episode) => episode.characterIds?.includes(character.id));
  const relatedFactions = project.factions.filter((faction) => faction.relatedCharacterIds?.includes(character.id));

  function updateSpec(key, value) {
    onUpdate({ spec: { ...(character.spec ?? {}), [key]: value } });
  }

  return (
    <EditorShell
      actions={<Button tone="danger" onClick={onDelete}>삭제</Button>}
      description={`${appearanceEpisodes.length}개 회차에 연결됨`}
      title="캐릭터 상세 편집"
    >
      <TextField label="이름" value={character.name} onChange={(value) => onUpdate({ name: value })} />
      <div className="editor-grid">
        <SelectField label="중요도" value={character.importance} onChange={(value) => onUpdate({ importance: value })}>
          {characterImportance.map((importance) => (
            <option key={importance} value={importance}>
              {importance}
            </option>
          ))}
        </SelectField>
        <TextField label="상태" value={character.status} onChange={(value) => onUpdate({ status: value })} />
      </div>
      <TextField label="역할" value={character.role} onChange={(value) => onUpdate({ role: value })} />
      <div className="editor-grid">
        <TextField label="첫 등장 화" type="number" value={character.firstEpisode} onChange={(value) => onUpdate({ firstEpisode: toNumberOrBlank(value) })} />
        <TextField label="마지막 등장 화" type="number" value={character.lastEpisode} onChange={(value) => onUpdate({ lastEpisode: toNumberOrBlank(value) })} />
      </div>
      <TextArea label="상처" value={character.wound} onChange={(value) => onUpdate({ wound: value })} />
      <TextArea label="욕망" value={character.desire} onChange={(value) => onUpdate({ desire: value })} />
      <TextArea label="캐릭터 아크" value={character.arc} onChange={(value) => onUpdate({ arc: value })} />
      <TextArea label="관계 메모" value={character.relationshipNotes} onChange={(value) => onUpdate({ relationshipNotes: value })} />
      <TextField label="태그" value={(character.tags ?? []).join(", ")} onChange={(value) => onUpdate({ tags: parseTextList(value) })} />
      <SectionTitle eyebrow="Appearance" title="외모 스펙" />
      <TextField label="나이대" value={character.spec?.age ?? ""} onChange={(value) => updateSpec("age", value)} />
      <TextField label="신장/체형" value={character.spec?.height ?? ""} onChange={(value) => updateSpec("height", value)} />
      <TextField label="머리/눈" value={character.spec?.colors ?? ""} onChange={(value) => updateSpec("colors", value)} />
      <TextArea label="외모 묘사" value={character.spec?.appearance ?? ""} onChange={(value) => updateSpec("appearance", value)} />
      <CheckGroup label="연결된 떡밥" options={project.foreshadows} values={character.relatedForeshadowIds} onChange={(relatedForeshadowIds) => onUpdate({ relatedForeshadowIds })} />
      <LinkedEpisodeButtons numbers={appearanceEpisodes.map((episode) => episode.number)} project={project} navigateTo={navigateTo} />
      <MiniList title="연결 세력" items={relatedFactions.map((faction) => faction.name)} />
    </EditorShell>
  );
}

function FactionsPage({ project, selectedIds, setSelectedIds, updateCollectionItem, addCollectionItem, deleteCollectionItem, navigateTo }) {
  const [query, setQuery] = useState("");
  const selected = project.factions.find((faction) => faction.id === selectedIds.factions) ?? project.factions[0];
  const filtered = project.factions.filter((faction) => {
    const normalized = query.trim().toLowerCase();
    return !normalized || [faction.name, faction.type, faction.goal, faction.conflictPoint, faction.narrativeUse].join(" ").toLowerCase().includes(normalized);
  });

  function addFaction() {
    addCollectionItem(
      "factions",
      {
        id: makeId("faction", "new"),
        name: "새 세력",
        type: "",
        goal: "",
        conflictPoint: "",
        narrativeUse: "",
        relatedCharacterIds: [],
        relatedEpisodeIds: [],
        status: "활성",
        memo: "",
        updatedAt: now()
      },
      "factions"
    );
  }

  return (
    <PageShell actions={<Button onClick={addFaction}>세력 추가</Button>} description="세력이 어떤 목표와 충돌로 회차 갈등을 만드는지 관리합니다." eyebrow="Factions" title="세력 관리">
      <section className="tool-layout">
        <div className="tool-main">
          <Card>
            <SearchInput value={query} onChange={setQuery} placeholder="세력명, 목표, 충돌 검색" />
          </Card>
          <div className="entity-grid two">
            {filtered.map((faction) => (
              <button
                className={selected?.id === faction.id ? "faction-card active" : "faction-card"}
                key={faction.id}
                type="button"
                onClick={() => setSelectedIds((current) => ({ ...current, factions: faction.id }))}
              >
                <div className="card-title-row">
                  <h3>{faction.name}</h3>
                  <Badge>{faction.type}</Badge>
                </div>
                <p>{faction.goal}</p>
                <small>{faction.conflictPoint}</small>
              </button>
            ))}
          </div>
        </div>
        <FactionEditor
          faction={selected}
          navigateTo={navigateTo}
          project={project}
          onDelete={() => deleteCollectionItem("factions", selected.id, "factions")}
          onUpdate={(patch) => updateCollectionItem("factions", selected.id, patch)}
        />
      </section>
    </PageShell>
  );
}

function FactionEditor({ faction, navigateTo, project, onDelete, onUpdate }) {
  if (!faction) return <EditorShell title="세력 선택" description="왼쪽에서 세력을 선택하세요." />;

  const relatedEpisodes = project.episodes.filter((episode) => episode.factionIds?.includes(faction.id));

  return (
    <EditorShell actions={<Button tone="danger" onClick={onDelete}>삭제</Button>} description="목표, 충돌, 캐릭터 연결을 관리합니다." title="세력 상세 편집">
      <TextField label="세력명" value={faction.name} onChange={(value) => onUpdate({ name: value })} />
      <div className="editor-grid">
        <TextField label="타입" value={faction.type} onChange={(value) => onUpdate({ type: value })} />
        <TextField label="상태" value={faction.status} onChange={(value) => onUpdate({ status: value })} />
      </div>
      <TextArea label="목표" value={faction.goal} onChange={(value) => onUpdate({ goal: value })} />
      <TextArea label="충돌 지점" value={faction.conflictPoint} onChange={(value) => onUpdate({ conflictPoint: value })} />
      <TextArea label="서사 사용법" value={faction.narrativeUse} onChange={(value) => onUpdate({ narrativeUse: value })} />
      <CheckGroup label="관련 캐릭터" options={project.characters} values={faction.relatedCharacterIds} onChange={(relatedCharacterIds) => onUpdate({ relatedCharacterIds })} />
      <TextArea label="메모" value={faction.memo} onChange={(value) => onUpdate({ memo: value })} />
      <LinkedEpisodeButtons numbers={relatedEpisodes.map((episode) => episode.number)} project={project} navigateTo={navigateTo} />
    </EditorShell>
  );
}

function WorldPage({ project, selectedIds, setSelectedIds, updateCollectionItem, addCollectionItem, deleteCollectionItem, navigateTo }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const selected = project.worldItems.find((item) => item.id === selectedIds.world) ?? project.worldItems[0];
  const filtered = project.worldItems.filter((item) => {
    const normalized = query.trim().toLowerCase();
    const matchesCategory = category === "all" || item.category === category;
    const matchesQuery = !normalized || [item.name, item.category, item.description, item.rule, item.narrativeUse, item.memo].join(" ").toLowerCase().includes(normalized);
    return matchesCategory && matchesQuery;
  });

  function addWorldItem() {
    addCollectionItem(
      "worldItems",
      {
        id: makeId("world", "new"),
        name: "새 세계관 항목",
        category: "지역",
        type: "",
        description: "",
        narrativeUse: "",
        rule: "",
        cost: "",
        caution: "",
        relatedEpisodeIds: [],
        relatedCharacterIds: [],
        relatedFactionIds: [],
        firstMentionEpisode: "",
        memo: "",
        updatedAt: now()
      },
      "world"
    );
  }

  return (
    <PageShell actions={<Button onClick={addWorldItem}>세계관 추가</Button>} description="지역, 종족, 규칙, 경제, 종교 등 장편 설정을 편집하고 회차와 연결합니다." eyebrow="World" title="세계관/규칙 관리">
      <section className="tool-layout">
        <div className="tool-main">
          <Card>
            <div className="filter-grid two">
              <SearchInput value={query} onChange={setQuery} placeholder="세계관 항목 검색" />
              <SelectField value={category} onChange={setCategory}>
                <option value="all">전체 분류</option>
                {worldCategories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </SelectField>
            </div>
          </Card>
          <div className="entity-grid two">
            {filtered.map((item) => (
              <button
                className={selected?.id === item.id ? "world-card active" : "world-card"}
                key={item.id}
                type="button"
                onClick={() => setSelectedIds((current) => ({ ...current, world: item.id }))}
              >
                <Badge>{item.category}</Badge>
                <h3>{item.name}</h3>
                <p>{item.description || item.rule}</p>
                {item.caution ? <small>{item.caution}</small> : null}
              </button>
            ))}
          </div>
        </div>
        <WorldEditor
          item={selected}
          navigateTo={navigateTo}
          project={project}
          onDelete={() => deleteCollectionItem("worldItems", selected.id, "world")}
          onUpdate={(patch) => updateCollectionItem("worldItems", selected.id, patch)}
        />
      </section>
    </PageShell>
  );
}

function WorldEditor({ item, navigateTo, project, onDelete, onUpdate }) {
  if (!item) return <EditorShell title="세계관 선택" description="왼쪽에서 항목을 선택하세요." />;

  const relatedEpisodes = project.episodes.filter((episode) => episode.worldItemIds?.includes(item.id));

  return (
    <EditorShell actions={<Button tone="danger" onClick={onDelete}>삭제</Button>} description="규칙, 비용, 주의점을 함께 관리합니다." title="세계관 상세 편집">
      <TextField label="이름" value={item.name} onChange={(value) => onUpdate({ name: value })} />
      <div className="editor-grid">
        <SelectField label="분류" value={item.category} onChange={(value) => onUpdate({ category: value })}>
          {worldCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </SelectField>
        <TextField label="타입" value={item.type} onChange={(value) => onUpdate({ type: value })} />
      </div>
      <TextArea label="설명" value={item.description} onChange={(value) => onUpdate({ description: value })} />
      <TextArea label="서사 사용법" value={item.narrativeUse} onChange={(value) => onUpdate({ narrativeUse: value })} />
      <TextArea label="규칙" value={item.rule} onChange={(value) => onUpdate({ rule: value })} />
      <TextArea label="대가/비용" value={item.cost} onChange={(value) => onUpdate({ cost: value })} />
      <TextArea label="주의할 설정" value={item.caution} onChange={(value) => onUpdate({ caution: value })} />
      <TextField label="첫 언급 화" type="number" value={item.firstMentionEpisode} onChange={(value) => onUpdate({ firstMentionEpisode: toNumberOrBlank(value) })} />
      <CheckGroup label="관련 캐릭터" options={project.characters} values={item.relatedCharacterIds} onChange={(relatedCharacterIds) => onUpdate({ relatedCharacterIds })} />
      <CheckGroup label="관련 세력" options={project.factions} values={item.relatedFactionIds} onChange={(relatedFactionIds) => onUpdate({ relatedFactionIds })} />
      <TextArea label="메모" value={item.memo} onChange={(value) => onUpdate({ memo: value })} />
      <LinkedEpisodeButtons numbers={relatedEpisodes.map((episode) => episode.number)} project={project} navigateTo={navigateTo} />
    </EditorShell>
  );
}

function TimelinePage({ project, selectedIds, setSelectedIds, updateCollectionItem, addCollectionItem, deleteCollectionItem, navigateTo }) {
  const [typeFilter, setTypeFilter] = useState("all");
  const selected = project.timeline.find((item) => item.id === selectedIds.timeline) ?? project.timeline[0];
  const filtered = project.timeline.filter((item) => typeFilter === "all" || item.type === typeFilter);

  function addTimelineItem() {
    addCollectionItem(
      "timeline",
      {
        id: makeId("timeline", "new"),
        timeLabel: "새 시점",
        event: "",
        impact: "",
        hook: "",
        type: "회차진행",
        relatedEpisodeIds: [],
        relatedCharacterIds: [],
        relatedWorldItemIds: [],
        updatedAt: now()
      },
      "timeline"
    );
  }

  return (
    <PageShell actions={<Button onClick={addTimelineItem}>연표 추가</Button>} description="세계관 사건과 회차 진행, 캐릭터 과거를 시간순으로 관리합니다." eyebrow="Timeline" title="연표 관리">
      <section className="tool-layout">
        <div className="tool-main">
          <Card>
            <SelectField label="타입 필터" value={typeFilter} onChange={setTypeFilter}>
              <option value="all">전체 타입</option>
              {timelineTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </SelectField>
          </Card>
          <div className="timeline-list">
            {filtered.map((item, index) => (
              <button
                className={selected?.id === item.id ? "timeline-item active" : "timeline-item"}
                key={item.id}
                type="button"
                onClick={() => setSelectedIds((current) => ({ ...current, timeline: item.id }))}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <Badge>{item.type}</Badge>
                  <h3>{item.timeLabel}</h3>
                  <p>{item.event}</p>
                  <small>{item.hook}</small>
                </div>
              </button>
            ))}
          </div>
        </div>
        <TimelineEditor
          item={selected}
          navigateTo={navigateTo}
          project={project}
          onDelete={() => deleteCollectionItem("timeline", selected.id, "timeline")}
          onUpdate={(patch) => updateCollectionItem("timeline", selected.id, patch)}
        />
      </section>
    </PageShell>
  );
}

function TimelineEditor({ item, navigateTo, project, onDelete, onUpdate }) {
  if (!item) return <EditorShell title="연표 선택" description="왼쪽에서 연표 항목을 선택하세요." />;

  return (
    <EditorShell actions={<Button tone="danger" onClick={onDelete}>삭제</Button>} description="시간, 영향, 훅과 연결 항목을 편집합니다." title="연표 상세 편집">
      <TextField label="시점" value={item.timeLabel} onChange={(value) => onUpdate({ timeLabel: value })} />
      <SelectField label="타입" value={item.type} onChange={(value) => onUpdate({ type: value })}>
        {timelineTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </SelectField>
      <TextArea label="사건" value={item.event} onChange={(value) => onUpdate({ event: value })} />
      <TextArea label="영향" value={item.impact} onChange={(value) => onUpdate({ impact: value })} />
      <TextArea label="다음 훅" value={item.hook} onChange={(value) => onUpdate({ hook: value })} />
      <CheckGroup label="관련 회차" options={project.episodes.map((episode) => ({ id: episode.id, name: `${episode.number}화 ${episode.title}` }))} values={item.relatedEpisodeIds} onChange={(relatedEpisodeIds) => onUpdate({ relatedEpisodeIds })} />
      <CheckGroup label="관련 캐릭터" options={project.characters} values={item.relatedCharacterIds} onChange={(relatedCharacterIds) => onUpdate({ relatedCharacterIds })} />
      <CheckGroup label="관련 세계관" options={project.worldItems} values={item.relatedWorldItemIds} onChange={(relatedWorldItemIds) => onUpdate({ relatedWorldItemIds })} />
      <LinkedEpisodeButtons numbers={project.episodes.filter((episode) => item.relatedEpisodeIds?.includes(episode.id)).map((episode) => episode.number)} project={project} navigateTo={navigateTo} />
    </EditorShell>
  );
}

function BoardPage({ project, updateProject, navigateTo }) {
  function addCard(columnId) {
    const card = {
      id: makeId("board", "new"),
      text: "새 메모",
      tags: [],
      episodeNumber: "",
      memo: "",
      createdAt: now(),
      updatedAt: now()
    };
    updateProject((current) => ({
      ...current,
      boardColumns: current.boardColumns.map((column) =>
        column.id === columnId ? { ...column, cards: [card, ...column.cards] } : column
      )
    }));
  }

  function updateCard(columnId, cardId, patch) {
    updateProject((current) => ({
      ...current,
      boardColumns: current.boardColumns.map((column) =>
        column.id === columnId
          ? {
              ...column,
              cards: column.cards.map((card) => (card.id === cardId ? { ...card, ...patch, updatedAt: now() } : card))
            }
          : column
      )
    }));
  }

  function deleteCard(columnId, cardId) {
    updateProject((current) => ({
      ...current,
      boardColumns: current.boardColumns.map((column) =>
        column.id === columnId ? { ...column, cards: column.cards.filter((card) => card.id !== cardId) } : column
      )
    }));
  }

  function moveCard(fromColumnId, toColumnId, cardId) {
    if (fromColumnId === toColumnId) return;
    const fromColumn = project.boardColumns.find((column) => column.id === fromColumnId);
    const card = fromColumn?.cards.find((item) => item.id === cardId);
    if (!card) return;

    updateProject((current) => ({
      ...current,
      boardColumns: current.boardColumns.map((column) => {
        if (column.id === fromColumnId) return { ...column, cards: column.cards.filter((item) => item.id !== cardId) };
        if (column.id === toColumnId) return { ...column, cards: [{ ...card, updatedAt: now() }, ...column.cards] };
        return column;
      })
    }));
  }

  return (
    <PageShell description="작품별 결정, 보강, 떡밥, 리스크, 아이디어를 운영합니다." eyebrow="Board" title="기획 보드">
      <section className="board-grid">
        {project.boardColumns.map((column) => (
          <article className="board-column" key={column.id}>
            <div className="board-column-head">
              <h3>{column.title}</h3>
              <Badge>{column.cards.length}</Badge>
            </div>
            <Button tone="secondary" onClick={() => addCard(column.id)}>
              메모 추가
            </Button>
            <div className="board-card-list">
              {column.cards.map((card) => (
                <div className="board-card" key={card.id}>
                  <textarea value={card.text} onChange={(event) => updateCard(column.id, card.id, { text: event.target.value })} />
                  <input placeholder="태그: 예산, 감정" value={(card.tags ?? []).join(", ")} onChange={(event) => updateCard(column.id, card.id, { tags: parseTextList(event.target.value) })} />
                  <input placeholder="관련 회차 번호" value={card.episodeNumber} onChange={(event) => updateCard(column.id, card.id, { episodeNumber: event.target.value })} />
                  <div className="board-card-actions">
                    <select value={column.id} onChange={(event) => moveCard(column.id, event.target.value, card.id)}>
                      {project.boardColumns.map((target) => (
                        <option key={target.id} value={target.id}>
                          {target.title}
                        </option>
                      ))}
                    </select>
                    {card.episodeNumber ? (
                      <Button
                        tone="ghost"
                        onClick={() => {
                          const episode = project.episodes.find((item) => item.number === Number(card.episodeNumber));
                          if (episode) navigateTo({ page: "episodes", id: episode.id });
                        }}
                      >
                        회차
                      </Button>
                    ) : null}
                    <Button tone="danger" onClick={() => deleteCard(column.id, card.id)}>
                      삭제
                    </Button>
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
    <PageShell description="원문 파일은 저장소에 올리지 않고, 추출한 역할과 보강 방향만 관리합니다." eyebrow="Sources" title="원고 분석">
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
    <PageShell description="회차, 캐릭터, 세력, 세계관, 연표, 떡밥, 메모를 한 번에 검색합니다." eyebrow="Search" title="전체 검색">
      <Card>
        <SearchInput value={query} onChange={setQuery} placeholder="검색어를 입력하세요" />
      </Card>
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

function PageShell({ actions, children, description, eyebrow, title }) {
  return (
    <div className="page-stack">
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

function EditorShell({ actions, children, description, title }) {
  return (
    <aside className="editor-panel">
      <div className="editor-head">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        {actions ? <div>{actions}</div> : null}
      </div>
      <div className="editor-body">{children}</div>
    </aside>
  );
}

function Card({ children, className = "" }) {
  return <article className={`card ${className}`}>{children}</article>;
}

function Button({ children, onClick, tone = "primary", type = "button" }) {
  return (
    <button className={`button ${tone}`} type={type} onClick={onClick}>
      {children}
    </button>
  );
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

function TextField({ label, onChange, placeholder = "", type = "text", value }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value ?? ""} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextArea({ label, onChange, rows = 3, value }) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea rows={rows} value={value ?? ""} onChange={(event) => onChange(event.target.value)} />
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

function CheckGroup({ label, onChange, options, values = [] }) {
  function toggle(id) {
    const next = values.includes(id) ? values.filter((value) => value !== id) : [...values, id];
    onChange(next);
  }

  return (
    <div className="check-group">
      <span>{label}</span>
      <div>
        {options.map((option) => (
          <label key={option.id}>
            <input checked={values.includes(option.id)} type="checkbox" onChange={() => toggle(option.id)} />
            <small>{option.name}</small>
          </label>
        ))}
      </div>
    </div>
  );
}

function EpisodeMiniMap({ episodes, onSelect, selectedId }) {
  return (
    <div className="minimap-wrap">
      <div className="episode-minimap">
        {[...episodes]
          .sort((a, b) => a.number - b.number)
          .map((episode) => (
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
  if (!warnings.length) {
    return <EmptyState title="큰 경고가 없습니다" description="지금은 장편 운영 상태가 안정적입니다." />;
  }

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

function LinkedEpisodeButtons({ navigateTo, numbers, project }) {
  const uniqueNumbers = [...new Set(numbers.filter(Boolean).map(Number))].sort((a, b) => a - b);

  if (!uniqueNumbers.length) {
    return <MiniList title="관련 회차" items={["연결된 회차가 없습니다."]} />;
  }

  return (
    <div className="linked-list">
      <span>관련 회차</span>
      <div>
        {uniqueNumbers.map((number) => {
          const episode = project.episodes.find((item) => Number(item.number) === number);
          return (
            <button
              disabled={!episode}
              key={number}
              type="button"
              onClick={() => episode && navigateTo({ page: "episodes", id: episode.id })}
            >
              {number}화
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MiniList({ items, title }) {
  return (
    <div className="mini-list">
      <span>{title}</span>
      {items.map((item) => (
        <small key={item}>{item}</small>
      ))}
    </div>
  );
}

function statusTone(status) {
  const tones = {
    미기획: "muted",
    기획중: "accent",
    초안완료: "info",
    수정중: "warning",
    완료: "success"
  };
  return tones[status] ?? "default";
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

function foreshadowTone(status) {
  const tones = {
    미회수: "danger",
    "부분 회수": "warning",
    "완전 회수": "success",
    폐기: "muted"
  };
  return tones[status] ?? "default";
}

function toNumberOrBlank(value) {
  return value === "" ? "" : Number(value);
}

function parseNumberList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map(Number)
    .filter((item) => Number.isFinite(item));
}

function parseTextList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getForeshadowEpisodes(project, foreshadow) {
  const connected = project.episodes
    .filter((episode) => episode.foreshadowIds?.includes(foreshadow.id))
    .map((episode) => episode.number);

  return [
    foreshadow.introducedEpisode,
    ...(foreshadow.reinforcedEpisodes ?? []),
    foreshadow.partialPayoffEpisode,
    foreshadow.fullPayoffEpisode,
    ...connected
  ].filter(Boolean);
}
