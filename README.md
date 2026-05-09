# 잿빛 눈물의 겨울 스토리 룸

4개 텍스트 원고를 바탕으로 만든 장편 스토리 기획용 React 사이트입니다. GitHub Pages에 올릴 수 있도록 정적 사이트로 구성했습니다.

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

## 사이트 기능

- 대시보드: 작품 핵심축, 주제, 10개 아크, 세계 이동축
- 200화 로드맵: 10개 아크 × 20화 구성, 검색과 아크 필터
- 설정집: 인물, 세력, 마법 규칙, 연표
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
