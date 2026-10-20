# 진행 기록 — 2026-10-19

## 단계 0: 첨부 자료 검사
- PASS: JAR/ZIP 구조, 파일 수, CRC/무결성, JSON 파싱 및 고유 SHA-1 참조 대조.
- PASS: GitHub `chansiu11/akzm` 원격의 `main`과 기존 히스토리 확인. 작업 전 파일이 비어 있음.
- BLOCKED: Render `list_services()`는 워크스페이스 미선택 오류. `list_workspaces()`에서 `chanjoo's workspace` (ID `tea-daqt4fu0tbcc7385uci0`) 발견. 도구 정책상 명시적 워크스페이스 선택을 요구하므로 서비스 정보 열람·배포는 아직 하지 않음.

## 단계 1: 웹 프로토타입
- CODED: 지형 높이 노이즈, 표면·땅·바위·광물·나무·물, 16x16 청크 메시, 13가지 비공기 블록 ID, 이동/점프/충돌, 마우스 타깃·길게 누르는 채굴·설치, 9칸 단축 가방, 낮/밤 색 변화, 로컬 저장.
- PASS: `node --test` 4개 지형 불변성/수정/저장/범위/물 테스트.
- PASS: `node --check` 로컬 주요 JS 파일 구문 검사.
- NOT YET VERIFIED: 실제 브라우저 GPU 렌더링, 포인터 잠금, 물리적 입력 조작과 웹 CDN 접근, GitHub Pages 반영. 코드 테스트 통과를 게임 전체 검증 통과로 간주하지 않음.
- LIMITATIONS: 무한 월드 전체 저장이 아닌 블록 변경 델타만 저장. 9칸 원형 가방은 정식 제작/인벤토리가 아님. 외부 Three.js CDN 접근 필요. AI/도구/멀티 없음. 모바일 조작 없음.

## 다음 세션 체크리스트
1. GitHub 최신 `main` HEAD와 위 작업 커밋을 비교 후 스모크 테스트.
2. 브라우저에서 최초 청크 렌더/마우스 포인터 고정/이동/점프/설치/파괴/새로고침 저장을 실제 확인하고 오류 수정.
3. Render 워크스페이스 승인 후 서비스 목록에서 `akzm` 연결 서비스를 식별하여 기존 설정을 보존. 다른 서비스를 건드리지 않음.
4. 0.2 바이옴/동굴, 0.3 제작/도구, 0.4 몬스터 AI 순으로 진행.

## GitHub 게시 및 HTTP 정적 리소스 추가 확인
- GitHub `main`에 첫 버전 11개 파일을 올린 커밋: `ede4ddc677fe1579d75e0994e23f7269ab18a585` (부모: `41622b24310000cc8322de6afb5abbb65effa13e`), 히스토리 보존, 강제 푸시 없음.
- PASS: 단순 HTTP 서버에서 `/`, `/src/main.js`, `/src/atlas.js`, `/src/terrain.js`, `/style.css`, `/docs/STATUS.md`가 HTTP 200을 반환.
- NOT VERIFIED: GitHub Pages 사이트가 이 커밋을 반영했는지와 브라우저 WebGL/원격 Three.js CDN 정상 동작 여부.

## 단계 1.1 — 2026-10-20 모바일 조작·사용자 제공 텍스처 불러오기
- CODED: 터치 월드 화면 드래그로 yaw/pitch 시점 조절, 이동 조이스틱, 점프·파괴·설치·가방·메뉴 버튼. PC 포인터 잠금 조작 유지.
- CODED: 사용자가 자기 기기에서 `.jar`/`.zip`을 선택하여 `assets/minecraft/textures/blocks/*.png` 16 슬롯과 잔디 오버레이를 로드. 선택한 아카이브는 네트워크로 전송하지 않음. 생성된 Atlas를 브라우저 localStorage에 저장·복원·삭제. 70MB 파일 크기 제한.
- FACT: 제공 JAR의 대응하는 16개 블록 텍스처 파일 경로 모두 확인, ZIP는 사운드/언어용 객체 데이터로 블록 텍스처 없음.
- PASS: `node --test` 7개(기존 4, 추가 터치 시점/조이스틱/파일 경로 3). `node --check` 구문 검사 통과. 로컬 HTTP 정적 파일 200 확인.
- NOT VERIFIED: 실제 스마트폰·WebGL·CDN·JAR 텍스처 렌더링 E2E. 로컬 Playwright 방문 시 환경에서 `net::ERR_BLOCKED_BY_ADMINISTRATOR`로 localhost 접속 거부.
- LIMITATIONS: JAR를 공개 호스팅하지 않으므로 사용자가 직접 골라야 함. 전 블록/모델/아이템까지 동일한 리소스팩 지원 아님. 원본 JAR에 포함된 텍스처를 이 저장소에 복사하지 않음.
- RENDER: 승인된 `chanjoo's workspace` 서비스 `breach-qoxmfvlfem`(qoxmfvlfem), `echoes-world-server`(rpggame) 2개, `akzm` 직접 연결 없음. Render 작업 없음.
- NEXT: 실제 모바일 터치 검사, 로컬 JAR 업로드/다시 방문 시 텍스처 복원, 1.8.9 모델/투명 블록/아이템 아틀라스 렌더링 확장.


## v0.3 — texture auto-loading and inventory visuals
- Implemented local-only `tools/prepare_local_resources.py` extracting all PNG files from a user-supplied Java JAR into gitignored `local-resources/`. This folder is not committed or published.
- Added automatic atlas loading from `local-resources/manifest.json` on page load; no pack chooser is shown. Existing 16 atlas tiles and optional grass side overlay resolve through the manifest.
- Hotbar and inventory now display the atlas pixels, rather than unrelated flat colored squares.
- If local originals are unavailable on a public deployment, preserve the independent generated textures; legacy browser-cached atlas is a fallback.
- Tests: Node tests and local Python extraction against a supplied 1.8.9.jar; real mobile browser graphics not yet conclusively verified.
- Scope limit: the original 1044 PNGs can be extracted locally but the game currently only renders its 16 existing block texture slots. Minecraft originals are NOT shipped through GitHub.

## 2026-10-20 — v0.4 menu + world selection + local textures
- 이전 원본 파일과 Git 기록 보존. GitHub 내 권한 범위는 `chansiu11/akzm`에 한정.
- 타이틀, 세계 선택/생성/삭제, 일시 정지, 설정 (FOV, 렌더 거리, 감도, 좌표 표시), 도움말을 코딩함.
- 사용자 보유 JAR 텍스처 16 슬롯을 private `local-resources/` 폴더로 준비한 경우 자동 적용. 원본 에셋은 GitHub Pages에 포함하지 않음.
- PC 1365×768 및 모바일 390×844 HTML/CSS 메뉴 Chromium 확인; 메뉴 전환 및 설정 동작 확인.
- Node.js 자동 테스트, JS 문법 검사 통과. WebGL 통합 테스트는 외부 three.js CDN 접근 제한으로 미완료.
- 미구현: 원작 수준의 모든 블록·아이템·사운드·월드 생성·제작·전투·AI·멀티플레이, 원작과 동일한 메뉴 아트.

## 2026-10-20 — v0.5 command palette and basic particles
- CODED: Java 1.8.9-style slash command palette, argument chips, examples, suggestions, Tab autocomplete, keyboard and touch submit/close.
- CODED: working subset of /help /time /tp /setblock /fill /particle /gamerule doDaylightCycle /seed, relative coordinates, block ID lookup, input validation, safe fill limit.
- CODED: light Three.js point particle pool; block breaking and placing trigger effects. This is not the vanilla particle rendering engine.
- CODED: daylightCycle persisted alongside the previous world save format without resetting existing worlds.
- UNIT TESTS: added command parser/dispatch tests, preserving old terrain, menu, touch and resource tests.
- LIMITATIONS: full 1.8.9 command catalog, chat, command blocks, scoreboards, NBT, entity targeting, real mobs, vanilla sprites and audio still missing. Browser GPU end-to-end separately tracked.
