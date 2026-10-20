# Java Edition 1.8.9 명령어 기능 — v1.3 로컬 개발본

## 범위 및 검증

이 단계는 사용자가 제공한 `1.8.9.jar`의 `assets/minecraft/lang/en_US.lang` 내 명령어 사용법 항목과 1.8.9의 구형 문법을 기준으로 만든 **독립 구현**입니다. 원본 바이너리/텍스처/사운드는 이 ZIP에 포함하지 않습니다.

- 59개 대표 이름 + 별칭 3개(`/?`, `/tell`, `/w`)의 목록과 문법 표시
- 이름/인수별 후보, 하위 명령어 경로별 제안, 반복 Tab 순환/Shift+Tab 역순, 마우스/터치 후보 선택
- 1.8.9 스타일 대상 선택자 후보 `@p @a @r @e` 및 문맥이 있을 때 현재 플레이어 이름
- 조준 블록 좌표/상대좌표 후보(`~`)와 등록된 블록·아이템·시험 엔티티 ID 후보
- 일부 명령어의 월드 변경/인벤토리/시드/날씨/난이도/스코어보드 상태 실제 연결
- **미구현 명령어를 실행 성공처럼 표시하지 않고 명확히 실패 처리**

**중요**: 59종 전체가 Java 1.8.9에서처럼 작동하는 것은 아닙니다. `scoreboard`, `execute`, `clone`, `fill`, `gamerule` 등도 일부 동작만 구현됐습니다. 월드에 없는 생물, 블록, 아이템, 모델, 포션 효과, 마법부여, LAN, 서버 관리, 월드 보더, 완전한 NBT 및 엔티티 선택자 필터 처리는 미완성입니다. 스코어보드 시각 표시/정식 서버 권한도 미완성입니다. 따라서 카탈로그와 실제 기능 구현 수를 혼동하지 마세요.

## 구현된 동작의 예

```text
/seed
/time set day
/weather rain 600
/difficulty hard
/gamerule keepInventory true
/give @p minecraft:stone 16
/clear @p minecraft:stone
/setblock ~ ~-1 ~ minecraft:stone
/fill ~ ~ ~ ~2 ~2 ~2 minecraft:stone 0 hollow
/testforblock ~ ~-1 ~ minecraft:stone
/clone ~ ~ ~ ~2 ~2 ~2 ~5 ~ ~ replace normal
/execute @p ~ ~ ~ say hello
/scoreboard objectives add demo dummy
/scoreboard players set Player demo 1
```

- 채팅/명령어 입력은 세계 생성 시 `치트 허용`을 켠 세계에서만 사용하도록 UI에서 제한함.
- 블록 변경은 로컬 게임 월드의 상태 변경 API에 연결하며 실행 수량은 **최대 4096블록**으로 제한함. 이는 성능 보호를 위한 임시 제한으로 원작과 다름.
- `/summon`은 현재 게임이 실제로 지원하는 **시험 엔티티 3종**만 대상이며 원작 생물로 표시하지 않음.
- 서버 관리 15종은 명령어 안내 목록에 포함되지만 현재 공식 서버와 연결되어 있지 않아 실행 불가.
- 현재 세계 시드를 `/seed`에 표시하도록 이전 하드코딩 문제 수정.
- `/gamerule keepInventory`는 사망 인벤토리 드롭과 연결. 다른 게임 규칙은 미구현 상태를 명시.
- `/tp @s`, `/execute as ... run` 같은 1.8.9에 없는 문법은 지원하지 않음.

## 테스트 상태

- `npm test`: 144개 자동 테스트 통과 (기존 136개 + 새 명령어 테스트 8개)
- `node --check`로 JavaScript 관련 파일 구문 검사
- 명령어 패널 Chromium 검증: `page.set_content` 격리 UI 테스트에서 Tab 이름 완성, 하위 명령어 완성, 연속 Tab 순환, Enter 제출 확인
- **실제 3D 게임 인게임 테스트 미완료**: Chromium 로컬 HTTP 접근 `ERR_BLOCKED_BY_ADMINISTRATOR`, 외부 Three.js 모듈 네트워크 접근 제한. 격리 UI 테스트는 인게임 테스트가 아님.
- 코드 저장용 로컬 ZIP만 작성. GitHub/Render는 변경하지 않음.

## 남은 원작 차이 (다음 기능 구현 필요)

1. 전체 명령어의 버전별 인수·오류 처리·권한 수준까지 1.8.9와 일치 여부 확인
2. 크리에이티브/어드벤처/관전자 모드의 실제 플레이 규칙
3. 원작 엔티티 ID, NBT/데이터값, 블록 상태, 포션/마법 부여 처리
4. `/scoreboard` 전체 하위 명령어, 플레이어 점수·트리거·팀 옵션 UI/권한
5. `/title`, `/tellraw`, `/playsound`, `/particle`의 전체 텍스트·리소스 구현
6. `/worldborder`, `/spreadplayers`, `/stats`, `/achievement` 등의 실제 동작
7. 바닐라 1.8.9 서버와 LAN, 인증·권한·서버 운영 명령어 연동
8. 단순 자체 명령 UI가 아닌 실제 원작 1.8.9와의 인게임 행동·Tab 완성 결과 비교

## 전체 명령어 등록 상태 (목록 등록 ≠ 동작 구현)

| 명령어 | 안내 문법 | 구현 범위 |
|---|---|---|
| `/achievement` | `/achievement <give|take> <stat_name|*> [player]` | 문법 안내만 지원 |
| `/clear` | `/clear [player] [item] [data] [maxCount] [dataTag]` | 부분 실행 |
| `/defaultgamemode` | `/defaultgamemode <mode>` | 문법 안내만 지원 |
| `/difficulty` | `/difficulty <difficulty>` | 부분 실행 |
| `/effect` | `/effect <player> <effect|clear> [seconds] [amplifier] [hideParticles]` | 문법 안내만 지원 |
| `/enchant` | `/enchant <player> <enchantment> [level]` | 문법 안내만 지원 |
| `/gamemode` | `/gamemode <mode> [player]` | 문법 안내만 지원 |
| `/gamerule` | `/gamerule <rule> [value]` | 부분 실행 |
| `/give` | `/give <player> <item> [amount] [data] [dataTag]` | 부분 실행 |
| `/kill` | `/kill [target]` | 부분 실행 |
| `/seed` | `/seed` | 부분 실행 |
| `/setworldspawn` | `/setworldspawn [x] [y] [z]` | 부분 실행 |
| `/spawnpoint` | `/spawnpoint [player] [x] [y] [z]` | 부분 실행 |
| `/spreadplayers` | `/spreadplayers <x> <z> <spreadDistance> <maxRange> <respectTeams> <players...>` | 문법 안내만 지원 |
| `/time` | `/time <set|add|query> <value>` | 부분 실행 |
| `/toggledownfall` | `/toggledownfall` | 부분 실행 |
| `/tp` | `/tp [target] <destination|x y z> [yaw] [pitch]` | 부분 실행 |
| `/weather` | `/weather <clear|rain|thunder> [duration]` | 부분 실행 |
| `/worldborder` | `/worldborder <set|add|center|damage|warning|get> ...` | 문법 안내만 지원 |
| `/xp` | `/xp <amount>[L] [player]` | 문법 안내만 지원 |
| `/blockdata` | `/blockdata <x> <y> <z> <dataTag>` | 문법 안내만 지원 |
| `/clone` | `/clone <x1> <y1> <z1> <x2> <y2> <z2> <x> <y> <z> [maskMode] [cloneMode] [TileName]` | 부분 실행 |
| `/entitydata` | `/entitydata <entity> <dataTag>` | 문법 안내만 지원 |
| `/execute` | `/execute <entity> <x> <y> <z> [detect ...] <command...>` | 부분 실행 |
| `/fill` | `/fill <x1> <y1> <z1> <x2> <y2> <z2> <block> [data] [oldBlockHandling] [dataTag]` | 부분 실행 |
| `/particle` | `/particle <name> <x> <y> <z> <dx> <dy> <dz> <speed> [count] [mode]` | 부분 실행 |
| `/playsound` | `/playsound <sound> <player> [x] [y] [z] [volume] [pitch] [minVolume]` | 문법 안내만 지원 |
| `/replaceitem` | `/replaceitem <entity|block> ...` | 문법 안내만 지원 |
| `/scoreboard` | `/scoreboard <objectives|players|teams> ...` | 부분 실행 |
| `/setblock` | `/setblock <x> <y> <z> <block> [data] [replace|destroy|keep] [dataTag]` | 부분 실행 |
| `/stats` | `/stats <entity|block> ...` | 문법 안내만 지원 |
| `/summon` | `/summon <EntityName> [x] [y] [z] [dataTag]` | 부분 실행 |
| `/testfor` | `/testfor <player|selector> [dataTag]` | 부분 실행 |
| `/testforblock` | `/testforblock <x> <y> <z> <block> [data] [dataTag]` | 부분 실행 |
| `/testforblocks` | `/testforblocks <x1> <y1> <z1> <x2> <y2> <z2> <x> <y> <z> [all|masked]` | 부분 실행 |
| `/title` | `/title <player> <title|subtitle|clear|reset|times> ...` | 문법 안내만 지원 |
| `/trigger` | `/trigger <objective> <set|add> <value>` | 문법 안내만 지원 |
| `/help` | `/help [page|command]` | 부분 실행 |
| `/me` | `/me <action...>` | 부분 실행 |
| `/msg` | `/msg <player> <message...>` | 부분 실행 |
| `/say` | `/say <message...>` | 부분 실행 |
| `/tellraw` | `/tellraw <player> <rawJson...>` | 부분 실행 |
| `/debug` | `/debug <start|stop>` | 문법 안내만 지원 |
| `/publish` | `/publish` | 문법 안내만 지원 |
| `/ban` | `/ban <player> [reason...]` | 서버 미연결 |
| `/ban-ip` | `/ban-ip <address|player> [reason...]` | 서버 미연결 |
| `/banlist` | `/banlist [ips|players]` | 서버 미연결 |
| `/deop` | `/deop <player>` | 서버 미연결 |
| `/kick` | `/kick <player> [reason...]` | 서버 미연결 |
| `/list` | `/list` | 서버 미연결 |
| `/op` | `/op <player>` | 서버 미연결 |
| `/pardon` | `/pardon <player>` | 서버 미연결 |
| `/pardon-ip` | `/pardon-ip <address>` | 서버 미연결 |
| `/save-all` | `/save-all` | 서버 미연결 |
| `/save-off` | `/save-off` | 서버 미연결 |
| `/save-on` | `/save-on` | 서버 미연결 |
| `/setidletimeout` | `/setidletimeout <minutes>` | 서버 미연결 |
| `/stop` | `/stop` | 서버 미연결 |
| `/whitelist` | `/whitelist <on|off|list|add|remove|reload> [player]` | 서버 미연결 |
