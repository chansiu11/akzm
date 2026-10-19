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
