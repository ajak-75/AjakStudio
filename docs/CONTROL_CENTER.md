# CONTROL CENTER — 운영 안내

Version 1.0 · 2026-11-20 · phase 4 deliverable
주소: **`/ko/admin/`** (한국어) · **`/en/admin/`** · `/admin/`은 `/ko/admin/`으로 포워딩합니다.
`noindex, nofollow` — 검색에 노출되지 않습니다.

> **요약 (Korean summary)**
> 비공개 관리자 15개 메뉴와 Hero Studio를 정적 export 구조 위에서 구현했습니다. Supabase 키가 없으면 **로컬 미리보기 모드**로 브라우저(IndexedDB)에 저장하고, 키가 있으면 Supabase Auth 로그인 + `admin_users` 권한 확인을 거칩니다. Hero Studio에서 **게시(Publish)** 한 시안만 공개 HOME에 반영되며, 게시 전에는 기본 에디토리얼 히어로(까치 호랑이 클린본)가 그대로 보입니다. 원본 이미지는 삭제하지 않고 보관(archive)만 하며, JSON 한 파일로 전체 백업·복구가 됩니다.

---

## 1. 두 가지 실행 모드

| | 로컬 미리보기 모드 | Supabase 모드 |
| --- | --- | --- |
| 조건 | `NEXT_PUBLIC_SUPABASE_URL`·`ANON_KEY` 없음 | 두 값이 모두 설정됨 |
| 로그인 | 없음 (화면 상단에 모드 배너) | 이메일+비밀번호 또는 이메일 링크 |
| 권한 | 브라우저 전체 | `admin_users`에 `is_active` 행이 있는 계정만 |
| 데이터 | IndexedDB (`gdu-control-center`) + 이미지 blob 분리 저장 | 로컬 저장 + 히어로 게시는 `hero_layouts`에도 기록 |
| 공개 HOME 히어로 | 이 브라우저에 게시한 시안 | 이 브라우저 게시본 → 없으면 Supabase 게시본 |

**로컬 저장의 정직한 한계.** 로컬 미리보기는 *이 브라우저*의 데이터입니다. 앱 15개 메뉴의 편집 내용은 아직 Supabase 테이블로 자동 기록되지 않습니다(히어로 게시만 기록). 실 DB 동기화는 5단계에서 테이블별 매핑으로 붙입니다. 모드 배너도 그렇게 표시합니다.

브라우저 저장소는 `navigator.storage.persist()`를 요청하고, 저장 실패 시 상단에 "저장 실패"가 표시됩니다. 그때는 15번 백업 메뉴에서 JSON을 먼저 내려받으세요.

---

## 2. 15개 메뉴

| # | 메뉴 | 하는 일 | 저장 위치 |
| --- | --- | --- | --- |
| 01 | 전체 사업 현황 | 앱·채널·콘텐츠·이미지·프로젝트·할 일·이번 달 지출 요약, 히어로 게시 상태, 시스템 상태, 마감 임박 | 파생 계산 |
| 02 | 앱 관리 | 5개 앱(Ajak·KOMI-Diary·KOMI & MOMO POP·K-Sajoo·ABI) + 새 앱/게임 추가·수정·삭제·정렬 | `apps` |
| 03 | SNS 채널 | 8개 채널의 주소·핸들·국가·언어·분야·상태, 새 플랫폼 추가 | `channels` |
| 04 | Hero Studio | 이미지 업로드·레이어·크롭·텍스트·PC/모바일·버전·게시 | `heroLayouts` + 이미지 |
| 05 | 콘텐츠 | HOME/ABOUT/NEWS 문구·소식, 상태(draft/review/published) | `contents` |
| 06 | 이미지 자료실 | JPG·PNG·WebP 5MB 이하 업로드, 미리보기, 원본 보존, 보관/복원/완전 삭제 | `images` + blob |
| 07 | 영상 자료실 | YouTube·Drive 링크만 등록 (무료 1GB 안내) | `videos` |
| 08 | 문서 자료실 | 기획서·계약·가이드 링크와 메모 | `docs` |
| 09 | AI 프롬프트 | 카테고리·검색·**복사 버튼**·사용 횟수 | `prompts` |
| 10 | 프로젝트 | 진행 상태·단계·목표일 | `projects` |
| 11 | 작업 일정 | 할 일·마감일·우선순위·프로젝트 연결 | `tasks` |
| 12 | GitHub 저장소 | 연결된 6개 저장소 목록·역할·공개 범위·clone 명령 | `repos` |
| 13 | Notion 연결 | 워크스페이스 정보·연결 안내·데이터베이스 링크 | `notion` |
| 14 | 매출 및 비용 | 수입/지출 입력, 월별 합계, **인프라 ₩0 한도 체크** | `finance` |
| 15 | 백업 관리 | 전체 JSON 내보내기(이미지 포함 선택)·가져오기 복구·기록·초기화 | `backup` + 파일 |

모든 표는 같은 규칙을 씁니다: 검색, 행 추가, 행 수정(모달), 두 단계 삭제 확인, 위/아래 정렬. 필드 정의는 `src/lib/admin/defs.ts` 한 곳에 있어 새 컬럼은 정의 한 줄로 끝납니다.

---

## 3. Hero Studio

### 3.1 캔버스 편집기
- 업로드: 클릭 또는 드래그, JPG/PNG/WebP, 5MB 이하. **원본 바이트는 그대로 보관**하고 크롭 값만 시안에 기록합니다.
- 이미지 레이어: 여러 장, 순서(앞/뒤), 표시/숨김, 삭제. 캔버스를 드래그하면 선택 레이어가 이동합니다.
- 조정: 크기(Scale 0.4–3×), 위치 X/Y, 불투명도, 크롭(16:9·4:3·1:1·원본 + X/Y/폭/높이).
- 텍스트: 킥커·헤드라인·서브카피(한국어/영어 각각), 정렬, 위치, 크기, 색, 텍스트 폭, 가독성 스크림.
- 배경색, 프레임 비율(16:9 / 4:3 / 1:1 / 자유·직접 입력).
- PC(내부 1600px) / 모바일(내부 900px, 375px 화면 기준) 전환 미리보기. **두 프레임은 별도로 편집**됩니다.

### 3.2 버전과 게시
- `시안 저장` = 새 버전 추가 (v1, v2 …). 기존 버전은 덮어쓰지 않습니다.
- `복원` = 선택 버전을 **새 버전으로 복제** (원본 유지).
- `게시` = 그 버전만 공개. 같은 이름의 다른 버전은 자동으로 게시 해제.
- `게시 취소` = 공개 HOME은 기본 히어로로 돌아갑니다.
- Supabase가 연결되어 있으면 게시 시 `hero_layouts`에 행을 만들고 `publish_hero_layout()` RPC로 게시합니다. 실패하면 화면에 이유를 그대로 표시하고 **로컬 게시는 유지**합니다.

### 3.3 공개 HOME에 반영되는 경로
```
Hero Studio ──저장──▶ heroLayouts(브라우저) ──게시──▶ published = true
                                                     │
공개 HOME (components/home/HomeHero.tsx)  ◀──────────┘
  1) 이 브라우저의 게시본 (readData → publishedLayout)
  2) 없으면 Supabase hero_layouts where is_published (anon 키 + RLS)
  3) 둘 다 없으면 기본 히어로 (까치 호랑이 클린본 + 에디토리얼 문구)
```
게시본은 편집기와 **같은 `drawHero()` 함수**로 캔버스에 그립니다. 좌표는 모두 0–1 비율이라 PC·모바일·공개 화면이 같은 비율을 유지합니다.

### 3.4 기본 아트워크
| 파일 | 크기 | 용도 |
| --- | --- | --- |
| `public/hero/hojakdo-clean.png` | 1100², 1.8MB | 기본 HOME 히어로 (까치 호랑이 · 틀 없는 한지 배경본) |
| `public/hero/hojakdo-clean.webp` | 1100², 125KB | 실제 전송용 (picture/srcset, 캔버스) |
| `public/hero/ilwolobongdo-clean.png` | 1100², 1.6MB | 보관용 원본 (1번 시안 · 일월오봉도 클린본) |
| `public/hero/ilwolobongdo-clean.webp` | 1100², 196KB | 전송용 |

두 작품 모두 Hero Studio 기본 이미지 목록과 6번 이미지 자료실 초기 시드에 들어 있습니다(`src/lib/admin/builtinImages.ts`). 원본 PNG는 5MB 이하·25MiB 이하 조건을 만족합니다.

---

## 4. 백업과 복구

- 내보내기: `global-digital-universe.control-center` 형식의 JSON. **이미지 원본 포함**을 켜면 base64로 들어가 파일이 커집니다.
- 가져오기: 파일을 먼저 **검사**(형식·버전·컬렉션 누락·이미지 항목)하고, 통과한 파일만 요약을 보여 준 뒤 복구합니다.
- 복구는 현재 데이터를 교체합니다. 교체 전 데이터는 백업 기록에 남고, 기록은 최근 30건까지 유지됩니다.
- 초기화는 시드(앱 5 · 채널 8 · 기본 히어로)로 되돌립니다. 두 단계 확인을 거칩니다.

Supabase Free는 자동 백업이 없습니다. **주 1회 내보내기**를 일정(11번 메뉴)에 넣어 두는 것을 권합니다.

---

## 5. 보안

- `service_role` 키는 이 저장소에 존재하지 않습니다. 모든 접근은 anon 키 + RLS입니다.
- 관리자 판정은 브라우저의 `admin_users` 조회 결과 + 서버(RLS) `is_admin()` 이중입니다. UI 숨김은 편의일 뿐, 실제 차단은 RLS가 합니다.
- 업로드 검증: MIME(JPG/PNG/WebP) + 5MB + 빈 파일 거부. 파일 이름은 저장 키로 쓰지 않습니다(`blob_<id>`).
- 공개 페이지는 `noindex`가 아니지만 관리자 화면은 `noindex, nofollow, nocache`입니다.
- 배포 헤더는 `public/_headers`(정적 export가 `out/_headers`로 복사)에 있습니다. 전체 경로에 `X-Frame-Options: DENY`·`X-Content-Type-Options: nosniff`·`Referrer-Policy`·`Permissions-Policy`(카메라·마이크·위치 차단)·`HSTS`, `/ko/admin`·`/en/admin`(및 하위)에 `X-Robots-Tag: noindex, nofollow`와 `Cache-Control: no-store`를 겁니다. `public/robots.txt`도 관리자 경로 두 개를 막습니다.
- CSP는 아직 넣지 않았습니다. 정적 export가 부트스트랩 스크립트를 인라인으로 내보내므로, 스크립트 해시까지 확인한 CSP를 만든 뒤 phase 5에서 추가합니다.

---

## 6. 검증 방법

```bash
npm run typecheck     # tsc --noEmit — 오류 0
npm run test:admin    # 순수 로직 82개 (히어로 기하·버전·게시·백업·재무·시드)
npm run test:render   # 15개 화면 서버 렌더 스모크 테스트
npm run build         # 정적 export → out/
```

`test:render`는 브라우저 없이 실제 컴포넌트를 렌더해 화면이 비어 있거나 예외가 나는 경우를 잡습니다. 클릭 동작(업로드·게시·다운로드)은 배포 후 브라우저에서 한 번 확인하는 것이 최종 관문입니다.
