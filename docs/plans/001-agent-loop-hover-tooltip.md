# 001 — `/agent-loop` 페이지 단계별 호버 툴팁 추가 (TODO #1)

> 계획 문서 컨벤션: `docs/plans/NNN-목적-요약.md` (3자리 순번 + 구현 목적 kebab-case). 이 문서가 첫 번째(001).

## Context

TODO.md #1 실습 작업. `/agent-loop` 페이지의 `LoopDiagram` SVG에는 6개 단계 노드(원)가 있지만 숫자만 표시되고, 설명은 오른쪽 목록에만 있다. 노드에 마우스 호버 또는 키보드 포커스(Tab) 시 해당 단계의 더 자세한 설명 카드(툴팁)가 뜨고, ESC로 닫히도록 한다 (a11y 포함).

**성공 기준** (TODO.md): 마우스 호버 / Tab 포커스 모두에서 툴팁이 보이고, ESC로 닫힘.

## 현재 구조

- `components/LoopDiagram.tsx` — 서버 컴포넌트(현재 state 없음). `STEPS` 배열(`label`, `detail`)을 SVG 원형 다이어그램 + `<ol>` 목록으로 렌더. 노드는 `viewBox="0 0 400 400"` 좌표계의 `positions[i]`(x, y)에 배치.
- 현재 `<svg>`에 `role="img"` + `aria-label`이 있음 — 인터랙티브(포커스 가능) 자식을 넣으면 `role="img"`(presentational children)와 충돌하므로 **`role="img"`를 제거하고 `role="group"` + 기존 `aria-label` 유지**로 바꾼다.
- `app/agent-loop/page.tsx` — `<LoopDiagram />` 사용. **변경 불필요** (컴포넌트 내부에서 완결).
- 테스트: Vitest + jsdom + `@testing-library/react`(v16)만 설치됨. `@testing-library/jest-dom`·`user-event`는 **없음** → matcher는 `toBeInTheDocument()` 대신 `expect(queryByRole("tooltip")).toBeNull()` / `not.toBeNull()` 같은 기본 단언 사용, 이벤트는 `fireEvent` 사용(jsdom에서 SVG 요소의 실제 `.focus()` 호출은 신뢰할 수 없으므로 `fireEvent.focus(node)`로 이벤트를 직접 디스패치). 외부 의존성 추가 없음.

## 구현 계획 (TDD)

### 1단계 — Red: 테스트 먼저 작성

새 파일 `tests/loop-diagram.test.tsx`. 노드 선택은 각 `<g>`에 부여할 `aria-label={step.label}` 기준 `screen.getByLabelText("1. 프롬프트")` 사용:

1. 렌더 시 툴팁(`role="tooltip"`)이 없다 (`queryByRole("tooltip")`이 `null`).
2. 1번 노드에 `fireEvent.mouseOver` → 툴팁이 보이고 해당 단계 `description` 텍스트 포함, `fireEvent.mouseOut` → 사라짐. (**주의**: React는 `onMouseEnter`/`onMouseLeave`를 `mouseover`/`mouseout` 네이티브 이벤트에서 합성하므로 `fireEvent.mouseEnter`는 핸들러를 트리거하지 못하는 알려진 이슈가 있음 — 반드시 `mouseOver`/`mouseOut` 사용.)
3. 노드에 `fireEvent.focus` → 툴팁 표시, `fireEvent.blur` → 사라짐. (React 17+는 `focusin`/`focusout`으로 위임하므로 `fireEvent.focus`가 핸들러를 트리거하지 못하면 `fireEvent.focusIn`/`focusOut`으로 대체.)
4. ESC 닫힘 2케이스: (a) `mouseOver`로 연 뒤 **document에** `Escape` keydown → 닫힘 (호버 사용자는 포커스가 노드에 없으므로 document 레벨에서 받아야 함, WCAG 1.4.13), (b) `focus`로 연 뒤 document `Escape` → 닫힘. "ESC 후에도 포커스가 노드에 남는다"는 jsdom에서 단언 불가(`fireEvent.focus`는 이벤트만 디스패치하고 실제 포커스를 옮기지 않음) → **3단계 수동 검증 항목으로 이관**.
5. a11y: 모든 노드에 `tabIndex=0`이 있고, **노드를 활성화(focus)했을 때** 그 노드에 `aria-describedby="loop-tooltip"`이 부여되며 동일 `id`의 툴팁 요소와 연결됨 (비활성 시에는 존재하지 않는 id를 가리키지 않도록 속성 자체를 빼므로, 상시 존재를 단언하지 않는다).
6. 노드 `fireEvent.click` → 툴팁 열림 (터치/Safari 안전망 `onClick` 경로).
7. 열린 상태에서 다이어그램 바깥(`document.body`) `fireEvent.click` → 닫힘 (터치 닫기 경로).

테스트 케이스 총 8건 (4번이 2케이스).

`npm test`로 실패(Red) 확인.

### 2단계 — Green: `components/LoopDiagram.tsx` 수정

- 파일 최상단에 `"use client"` 추가 (호버/포커스 state 필요). 정적 콘텐츠라 SSR 손실 영향 없음.
- `STEPS`에 `description` 필드 추가 — 기존 `detail`보다 자세한 1~2문장 한국어 설명.
- `const [activeStep, setActiveStep] = useState<number | null>(null)` 추가.
- `<svg>`의 `role="img"`를 `role="group"`으로 변경 (포커스 가능한 자식과의 충돌 방지, "현재 구조" 참고).
- 각 SVG 노드 `<g>`에:
  - `tabIndex={0}`, `aria-label={step.label}`, 활성 시에만 `aria-describedby="loop-tooltip"` (클릭 액션이 없으므로 `role="button"`은 쓰지 않음 — Enter/Space 동작 기대를 유발하는 안티패턴)
  - `onMouseEnter`/`onMouseLeave`, `onFocus`/`onBlur`
  - **가시적 포커스 인디케이터** (WCAG 2.4.7): SVG는 브라우저 기본 포커스 링이 일관되게 그려지지 않으므로, `activeStep === i`일 때 노드 `<circle>`의 `stroke`/`strokeWidth`를 강조(예: `#06b6d4`, `strokeWidth 3`)하고 `cursor: pointer` 부여. 단, **state에만 의존하면 ESC로 닫은 뒤(`activeStep=null`) 포커스가 노드에 남아 있어도 링이 사라지므로**, `<g>`의 `:focus-visible` 상태에서도 강조가 유지되도록 CSS(Tailwind `focus-visible:` 또는 전역 셀렉터)를 병행한다.
  - 터치 디바이스: 기본 경로는 **탭 → `focus`로 열리고, 화면의 다른 곳 탭 → `blur`로 닫힘** (`tabIndex=0` 요소는 모바일 브라우저에서 탭 시 포커스됨). 다만 Safari 계열은 클릭/탭 시 포커스 부여가 비일관적이므로 안전망으로 `onClick={() => setActiveStep(i)}` (열기 전용·멱등 — 토글로 만들면 데스크톱에서 호버로 열린 상태를 클릭이 닫아버리는 어색한 UX 발생)을 추가한다.
- ESC 닫기: 노드 `onKeyDown`이 아니라 **`useEffect`로 `activeStep !== null`일 때 document `keydown` 리스너 등록** (호버로 연 경우 포커스가 노드에 없어도 ESC가 동작해야 함 — WCAG 1.4.13). cleanup에서 리스너 제거.
- 바깥 클릭/탭 닫기: 같은 `useEffect`에서 document `click` 리스너도 등록 — 래퍼 div `ref`로 `wrapperRef.current.contains(e.target)`를 검사해 **외부 클릭이면 닫는다**. 터치에서 `onClick`으로 연 경우(포커스가 안 잡히면 `blur`도 ESC도 불가) 유일한 닫기 경로.
- 툴팁 렌더링: SVG를 `relative` 컨테이너 div로 감싸되, **svg의 `mx-auto w-full max-w-[400px]` 클래스를 래퍼 div로 이동**하고 svg는 `w-full`만 유지 — 그래야 % 좌표 기준이 svg 박스와 일치한다. 활성 노드 좌표를 viewBox 비율(%)로 환산해 `absolute` 카드 div 표시:
  - `role="tooltip"`, `id="loop-tooltip"`, 기존 `surface` 클래스 재사용 + 단계 `label`(제목) + `description`(본문). 본문 색상은 `--color-muted` 대신 기본 전경색(`--color-fg`) 사용 — 작은 카드에서 muted는 대비가 낮아 가독성이 떨어짐.
  - 표시/숨김은 **지연 없이 즉시** 처리 (의도된 단순화 — `setTimeout` 지연을 넣으면 fake timers로 테스트 복잡도가 올라가고, 실습 규모에 과함).
  - `left: (p.x / 400) * 100%`, `top: (p.y / 400) * 100%` + `transform: translate(...)`로 노드 기준 정렬. 가장자리 노드가 컨테이너 밖으로 넘치지 않도록 **노드의 좌우·상하 위치에 따라 translate 방향을 모두 조정** — 좌측 노드(x < 200)는 오른쪽으로, 우측은 왼쪽으로 펼치고, **상단 노드(y < 200)는 아래로, 하단 노드는 위로** 펼친다. `max-w`를 지정.
  - 마우스 이벤트 간섭(깜빡임) 방지 `pointer-events: none` — 트레이드오프: WCAG 1.4.13의 "hoverable"(포인터를 툴팁 위로 옮길 수 있어야 함)과 상충하나, 동일 내용이 항상 옆 `<ol>` 목록에 정적으로 존재하므로 허용 가능한 절충으로 판단.
- 상태 충돌 규칙: 포커스로 열린 상태에서 다른 노드 `mouseLeave`가 닫아버리지 않도록, **마지막 이벤트 우선(단일 `activeStep`)을 기본으로 하되 `blur`/`mouseLeave`는 자신이 연 단계와 일치할 때만 닫는다** (`setActiveStep(prev => prev === i ? null : prev)`).
- 기존 `<ol>` 목록·SVG 시각 요소는 그대로 유지.

`npm test`로 통과(Green) 확인.

### 3단계 — 검증

- `npm test` 전체 통과 (기존 `concepts.test.ts`, `errors.test.ts` 회귀 없음)
- `npm run typecheck`, `npm run lint`
- `npm run dev` → `http://localhost:3000/agent-loop`에서 실제 확인:
  - 호버 / Tab / ESC 동작
  - ESC로 닫은 뒤에도 키보드 포커스가 노드에 유지되는지 (jsdom 단언 불가 항목)
  - 가장자리 노드(특히 좌·우측) 툴팁이 화면 밖으로 넘치지 않는지, 모바일 폭(375px)에서도 확인
  - 브라우저 DevTools 터치 에뮬레이션: 노드 탭 → 열림, 다이어그램 바깥 탭 → 닫힘

## 변경 파일

| 파일                                         | 변경                                                        |
| -------------------------------------------- | ----------------------------------------------------------- |
| `docs/plans/001-agent-loop-hover-tooltip.md` | 신규 — 이 계획 문서 (순번 컨벤션의 첫 문서)                 |
| `components/LoopDiagram.tsx`                 | 수정 — 클라이언트 컴포넌트화, 툴팁 state·이벤트·렌더링 추가 |
| `tests/loop-diagram.test.tsx`                | 신규 — 툴팁 동작 테스트 8건                                 |
| `TODO.md`                                    | 수정 — 구현 완료 후 #1 체크박스 갱신                        |

코드 변경 파일 2개 + 문서 2개, 외부 의존성 추가 0개 — 실습 원칙 충족.

## 주의

- IDEAS/CLAUDE.md의 "의도적으로 혼재된 패턴"(fetch/axios, logger/console)은 건드리지 않음.
- main 직접 커밋 차단 훅이 있으므로 커밋은 별도 브랜치에서 진행 (커밋 요청 시).

## 알려진 한계 / 스코프 외

- 스크린 리더 중 일부는 포커스 직후 **동적으로 부여된** `aria-describedby`를 읽지 못할 수 있음. 동일 내용이 옆 `<ol>` 목록에 항상 존재해 정보 접근 자체는 보장됨. 문제가 확인되면 후속 작업으로 "툴팁을 상시 DOM에 두고 `visibility`로 토글" 방식 전환 검토.
- 호버/포커스 시 옆 `<ol>` 목록의 해당 항목 하이라이트는 연결성을 높이는 개선이지만 TODO #1 성공 기준 밖이므로 **이번 범위에서 제외** (별도 실습 후보).
