# GLOBAL DIGITAL UNIVERSE

글로벌 디지털 사업 통합 플랫폼 — 공식 홈페이지와 비공개 관리자(Control Center)를 하나의 저장소에서 운영합니다.
Next.js 15 (정적 export) · TypeScript · Tailwind CSS · Supabase Free · Cloudflare Pages Free · **운영비 0원**.

- 공개 사이트: 8개 메뉴 (HOME · ABOUT · OUR APPS · GAMES · K-CULTURE · MEDIA · NEWS · CONTACT), 한국어/영어
- 비공개 관리자: **`/ko/admin/`** · 15개 메뉴 + Hero Studio (4단계 완료) — 운영 안내는 [docs/CONTROL_CENTER.md](./docs/CONTROL_CENTER.md)
- 기본 히어로 아트워크: `까치 호랑이 클린본` (보관용 `일월오봉도 클린본`), Hero Studio에서 게시하면 즉시 교체
- 기존 앱 5개(`Ajak`, `KOMI-Diary`, `KOMI & MOMO POP`, `K-Sajoo`, `ABI`)는 **수정하지 않고 링크만** 연결합니다.
  - `ABI`는 스토어 배포 전이라 GitHub 직링크 대신 사이트 안 소개 페이지(`/ko/apps/abi/` · `/en/apps/abi/`)로 연결합니다.

---

## 빠른 시작

```bash
npm ci            # 또는 npm install
npm run dev       # http://localhost:3000 → /ko/ 로 이동
npm run typecheck # tsc --noEmit
npm run test:admin  # 관리자 순수 로직 82검사
npm run test:render # 관리자 15개 화면 렌더 스모크
npm run build     # 정적 export → out/
```

환경변수 없이도 빌드와 미리보기가 그대로 동작합니다. 데이터는 `src/config/brand.ts`의 시드에서
렌더링되고, Supabase 키를 넣으면 같은 화면이 DB 값을 사용합니다 (`.env.example` 참고).

## 배포 (Cloudflare Pages — Free)

| 항목 | 값 |
| --- | --- |
| 연결 저장소 | `ajak-75/AjakStudio` · branch `main` |
| Build command | `npm ci && npm run build` |
| Build output directory | `out` |
| Node version | 20 이상 (환경변수 `NODE_VERSION=22`) |
| 환경변수 | `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

`next.config.ts`에 `output: "export"`, `trailingSlash: true`가 설정되어 있어 모든 경로가
`/ko/apps/index.html` 형태로 생성됩니다. 서버 런타임·Functions는 사용하지 않습니다.

## 저장소 구조

```
docs/
  SYSTEM_ARCHITECTURE.md    전체 구조 · Control Center 15개 메뉴 · Hero Studio · 보안 · 단계 계획
  BRAND_DESIGN_SYSTEM.md    에디토리얼 화이트 토큰 · 타이포 · 그리드 · 금지 요소
  DATABASE_SCHEMA.sql       12개 테이블 + admin_users + RLS + Storage 정책 + 시드
  FREE_INFRA_AND_LIMITS.md  무료 한도 · 7일 정지 대응 · 영상 정책 · 백업/복구
src/
  app/(root)/               "/" → /ko/ 정적 포워딩
  app/(gate)/admin/         "/admin" → /ko/admin/ 정적 포워딩
  app/(site)/[locale]/      공개 8개 메뉴 (SSG, ko/en)
  app/(control)/[locale]/admin/  비공개 CONTROL CENTER (noindex)
  app/globals.css           디자인 토큰 단일 소스
  components/               Header · Footer · Hero · HomeHero · Editorial
  components/admin/         관리자 셸 · 15개 섹션 · Hero Studio · 공용 UI
  config/brand.ts           브랜드 · 메뉴 · 앱 5 · 게임 3 · 채널 8 · 뉴스 시드
  i18n/                     ko.json · en.json · 타입 안전 사전
  lib/admin/                데이터 모델 · 시드 · IndexedDB · 저장소 · 히어로 캔버스 · 백업
  lib/supabase/             client · server · types · guard
  public/hero/              기본 히어로 아트워크 (PNG 원본 + WebP 전송본)
scripts/                    관리자 자체 테스트 (로직 · 렌더)
```

## Supabase 적용 순서 (4단계에서)

1. Supabase 프로젝트 생성 (Free)
2. `docs/DATABASE_SCHEMA.sql` 전체를 SQL Editor에서 실행
3. Authentication → Email(OTP) 활성화, 관리자 계정 1개 생성
4. `insert into public.admin_users (id, display_name, role) values ('<auth user uuid>', 'Owner', 'owner');`
5. Project settings → API의 URL과 **anon** 키를 Cloudflare 환경변수에 입력 (service_role 키는 사용하지 않음)
6. 재배포 후 Control Center 로그인 확인

## 검증 (2026-11-20, phase 4)

| 항목 | 결과 |
| --- | --- |
| `npx tsc --noEmit` | 오류 0 |
| `npm run test:admin` | 81 / 81 통과 (히어로 기하·버전·게시·백업 왕복·재무·시드) |
| `npm run test:render` | 관리자 15개 화면 렌더 15 / 15 |
| `npm run build` | 성공 · 정적 페이지 23개 (ko/en × 9 + admin × 2 + 404 + root + gate) |
| `out/` | 218개 파일 · 12.7MB · 최대 파일 1.58MB (한도 20,000개 / 25MiB) |
| 첫 로드 JS | 공개 103 kB · 관리자 214 kB (gzip) |
| 서버 런타임 | 없음 (Functions 0회) |
| 유료 서비스 | 없음 (0원) |

## 원칙

- 무료 한도를 넘으면 자동 결제가 아니라 **대안 제시 또는 보고**.
- 원본 이미지는 삭제하지 않고 `archived_at`으로만 보관 (DB 트리거로 강제).
- 시안은 덮어쓰지 않고 새 버전으로 저장, 복원은 복제로.
- 확인되지 않은 외부 URL은 비워 두고 "준비 중 / 확인 중"으로 표시.
- 비밀정보는 코드·저장소에 넣지 않습니다 (service_role 키는 이 프로젝트에 존재하지 않음).
