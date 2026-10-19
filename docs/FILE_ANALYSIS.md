# 첨부된 Minecraft Java 1.8.9 자료 분석 — 2026-10-19

첨부 파일은 **읽기 전용**으로 ZIP 중앙 디렉터리와 JSON 스키마, 일부 모델 정의를 검사했습니다. 원본 내용은 저장소에 커밋하지 않습니다.

| 파일 | 크기 (바이트) | SHA-256 | 확인 결과 |
|---|---:|---|---|
| 1.8.9.jar | 8,461,484 | `14f0d96d1a56fb4f5c3b2233d00699525893fe5ce3dcf181e7de59120595d298` | ZIP 항목 5,597개, .class 2,507, .json 1,987, .png 1,044 |
| 1.8.9.json | 18,244 | `341af5f47a6b5bc137bfe681f4f3533e081041290aabbf9d7ebeae9881de768f` | `id=1.8.9`, Java 8, 37 라이브러리, client/server 다운로드 및 assetIndex 지시자 |
| 1.8.json | 78,494 | `14e3aa58cf578fd8573985ca96bf075d8be05477be988664a09446c7a76f4142` | 734개 경로 → 722개 고유 SHA-1 에셋 객체 |
| MC_1.8.9_Selected.zip | 107,455,444 | `7adc9b5b1a2e83a64ea37e8787afaa2f821c095dfa507de031764f4ee9aa6cae` | 항목 723개 (인덱스 1+객체 722); JSON 인덱스 본문 동일, 모든 722개 에셋 객체 해시 존재 |

아카이브 무결성 testzip 성공. JAR 비압축 크기 12,288,506 바이트. ZIP 비압축 크기 114,787,031 바이트.

## JAR의 실제 디렉터리

- `assets/minecraft/blockstates/` 340개: 예 `stone.json`, `acacia_door.json`, `anvil.json`. 블록 상태에 따른 모델 선택/회전 정보를 제공.
- `assets/minecraft/models/block/` 1,080개: 예 `grass.json`, `cube_all.json`, `acacia_log.json`. 면, UV, 텍스처 참조 등.
- `assets/minecraft/models/item/` 515개: 예 `diamond_sword.json`, `apple.json`. 아이템 모델과 화면 내 배치 설정.
- `assets/minecraft/textures/blocks/` 382개, `textures/items/` 229개: PNG 이미지.
- `.class` 2,507개: 난독화된 Java 바이트코드 중심. 정적 파일 명단 검사만으로 월드 생성 절차와 AI 결정을 확정할 수 **없음**.

`stone.json`에서는 `normal` 상태에 4개 모델/회전 선택이 기술되어 있었고, `grass.json`은 블록 정육면체의 면 별 UV·틴트 구조를 기술했습니다. `diamond_sword.json`은 `builtin/generated` 부모, `items/diamond_sword` 레이어, 1인칭/3인칭 표시 변환을 포함했습니다. 이는 **실제 본문 확인 사실**입니다.

## 에셋 ZIP의 구성과 빠진 것

`1.8.json` 인덱스의 734개 경로 구성: `minecraft/sounds/` 578, `minecraft/lang/` 74, `realms/lang/` 74, 양쪽 아이콘 6, `minecraft/sounds.json` 1, `pack.mcmeta` 1. 서로 동일한 객체 해시를 가리키는 경로가 있어 실제 독립 객체 수는 722. ZIP의 `objects/<첫2자리>/<SHA-1>` 형식 722개 모두 인덱스와 대응하고 빠진 객체가 0개입니다. 이 ZIP에는 블록 PNG 모델 세트는 포함되지 않으며, 그 일부는 JAR 내부에 있습니다.

## 확인과 일반 지식/추론을 구별

**확인:** 에셋 경로·개수, 모델 JSON, 라이브러리, 난독화 클래스 존재, 블록/아이템 모델 파일 이름, 사운드 파일 종류. **외부 지식에 기반한 설계 참고(첨부만으로 미검증):** Minecraft 1.8.9는 청크 단위 지형 및 바이옴/노이즈 기반 월드 생성, 몬스터 상태와 경로 탐색, 행동 우선순위, 광원과 스폰 조건 등을 사용합니다. 첨부 파일의 바이트코드를 디컴파일하여 특정 생성 함수나 AI 알고리즘을 검증한 것은 아닙니다. 몬스터가 존재한다는 사실을 사운드 파일명만으로 그 AI가 구현됐다고 판정할 수 없습니다.

## 원본 에셋 사용 정책

참고용 JAR/ZIP을 그대로 웹 배포하거나 제공 원본 그림/사운드/코드를 복사하지 않습니다. 개발 내용은 독립 로직과 코드로 만든 16×16 픽셀 스타일을 사용하며, 기능적 친숙함과 저작권 자료 복제를 구분합니다.
