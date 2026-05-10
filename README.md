# STORY 200

장편 웹소설 200화 설계를 위한 종합 React 운영툴입니다. 현재 등록된 작품은 `멸망 끝에 마녀를 주웠다`, `마왕성 회계팀 신입입니다만`이며, 이후 다른 스토리도 같은 구조로 추가할 수 있게 구성했습니다.

기본 데이터는 `frontend/src/data/storyData.js`의 seed를 사용하고, 사용자가 앱에서 수정한 작품 데이터는 브라우저 `localStorage`에 저장됩니다.

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
│       ├── data
│       │   ├── storyData.js
│       │   └── sampleForeshadows.js
│       └── utils
│           ├── analytics.js
│           ├── normalize.js
│           ├── search.js
│           └── storage.js
└── README.md
```

## 앱 기능

- 작품 슬롯: 등록된 작품 전환과 다음 작품 추가 슬롯
- 데이터 관리: 샘플 초기화, 현재 작품 JSON 내보내기, JSON 가져오기
- 대시보드: 진행률, 상태 카운트, 경고 카드, 최근 수정 회차, 1-200화 미니맵
- 회차 관리: 검색, 아크/상태/태그 필터, 상세 편집, 관련 캐릭터/세력/세계관/떡밥 연결
- 떡밥 관리: 추가/수정/삭제, 상태 필터, 관련 회차 이동, 방치 떡밥 경고
- 캐릭터 관리: 추가/수정/삭제, 중요도/태그 필터, 등장 회차와 관계 메모 관리
- 세력 관리: 추가/수정/삭제, 관련 캐릭터와 회차 연결
- 세계관 관리: 추가/수정/삭제, 분류 필터, 규칙/대가/주의점 관리
- 연표 관리: 추가/수정/삭제, 타입 필터, 관련 회차/캐릭터/세계관 연결
- 기획 보드: 메모 추가/수정/삭제, 태그, 관련 회차, 컬럼 이동
- 전체 검색: 회차, 캐릭터, 세력, 세계관, 연표, 떡밥, 메모 통합 검색
- 원고 분석: 작품별 텍스트 파일의 역할과 보강 방향

앱에서 수정한 데이터는 DB 없이 브라우저 `localStorage`에 저장됩니다.

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

현재 저장소는 `frontend/dist` 결과물을 루트 `index.html`과 `assets`에 반영한 뒤 `main` 브랜치에 푸시하는 방식으로 배포합니다. GitHub 저장소의 `Settings > Pages`에서 소스를 `Deploy from a branch`, 브랜치를 `main / root`로 선택하면 됩니다.

## FastAPI 백엔드

`backend`는 이전에 만든 로컬 FastAPI 스타터로 남겨두었습니다. GitHub Pages는 정적 호스팅만 지원하므로 배포 사이트는 백엔드를 사용하지 않습니다.
