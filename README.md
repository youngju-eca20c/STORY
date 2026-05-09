# STORY 200

장편 웹소설 200화 설계를 위한 종합 React 앱입니다. 현재 등록된 작품은 `멸망 끝에 마녀를 주웠다`이며, 이후 다른 스토리도 같은 구조로 추가할 수 있게 구성했습니다.

## 현재 구성

```text
.
├── backend
│   └── app
├── frontend
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src
│       ├── App.jsx
│       ├── main.jsx
│       ├── styles.css
│       └── data/storyData.js
└── README.md
```

## 앱 기능

- 작품 슬롯: 현재 작업 중인 작품과 다음 작품 추가 슬롯
- 대시보드: 작품 핵심축, 주제, 10개 아크, 세계 이동축
- 200화 로드맵: 10개 아크 × 20화 구성, 검색과 아크 필터
- 연표: 작품 전체 사건 흐름과 떡밥 회수 지점
- 캐릭터: 인물별 외모 스펙표, 상처, 욕망, 아크
- 세력: 목표, 충돌 지점, 서사 사용법
- 세계관: 지역, 마법 규칙, 대가
- 기획 보드: 결정 필요, 세계관 보강, 인물 아크, 리스크 메모
- 원고 분석: 4개 텍스트 파일의 역할과 보강 방향

기획 보드에서 추가한 메모는 DB 없이 브라우저 `localStorage`에 저장됩니다.

원고 전문 `.txt` 파일은 공개 저장소에 올라가지 않도록 `.gitignore`에 포함했습니다. 사이트에는 원고에서 추출한 분석/설정 데이터만 포함됩니다.

## 로컬 실행

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

브라우저에서 확인:

- http://127.0.0.1:5173

## 빌드 확인

```powershell
cd frontend
npm.cmd run build
```

결과물은 `frontend/dist`에 생성됩니다.

## 새 GitHub Pages로 배포

기존 GitHub Pages 저장소를 건드리지 않으려면 `youngju-eca20c/STORY`처럼 프로젝트 전용 새 저장소를 사용합니다. 배포 후 예상 주소는 아래와 같습니다.

- https://youngju-eca20c.github.io/STORY/

```powershell
git init
git add .
git commit -m "Create story room site"
git branch -M main
git remote add origin https://github.com/youngju-eca20c/STORY.git
git push -u origin main
```

배포는 `frontend/dist` 결과물을 `gh-pages` 브랜치에 올리는 방식으로 진행합니다. GitHub 저장소의 `Settings > Pages`에서 소스를 `Deploy from a branch`, 브랜치를 `gh-pages / root`로 선택하면 됩니다.

## FastAPI 백엔드

`backend`는 이전에 만든 로컬 FastAPI 스타터로 남겨두었습니다. GitHub Pages는 정적 호스팅만 지원하므로 배포 사이트는 백엔드를 사용하지 않습니다.
