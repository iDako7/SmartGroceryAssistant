# My Task Scope — Frontend, API Gateway, CI/CD & Metrics

**Author:** William
**Date:** 2026-03-25
**Role:** Person 2 (frontend) + Person 3 (api-gateway, infra) overlap

---

## 1. Current Status Summary

| Area | Status | Notes |
|------|--------|-------|
| **Web Frontend** | ~40% done | Basic pages (login/register/list/AI panel) built, but缺少 onboarding, profile editing, checkbox/strikethrough, collapsible sections, per-item AI buttons, Smart View |
| **API Gateway** | ~95% done | Fastify 5 proxy、JWT auth、rate limiting、CORS 已完成。WebSocket relay 代码存在但 List Service 无 `/ws` endpoint |
| **CI/CD** | ~80% done | GitHub Actions workflow 已就位，5 个 job 全部运行，E2E 测试 commented out，缺少 Docker image build/push |
| **Metrics Instrumentation** | 0% | 无任何 metrics 埋点 |

---

## 2. My Responsibilities

### 2.1 Web Frontend (Priority: HIGH)

**已完成的部分（队友或之前的工作）：**
- `login/page.tsx` 和 `register/page.tsx` — 基本认证流程
- `list/page.tsx` — 主列表页面（sections + items CRUD）
- `AiPanel.tsx` — Tab 式 AI 面板 (Translate, Item Info, Alternatives, Inspire)
- `SectionCard.tsx`, `ItemRow.tsx` — 列表展示组件
- `api.ts` — API client (users, lists, AI endpoints)
- `auth-context.tsx` — Auth context provider
- 3 个 unit tests + 4 个 E2E tests (commented out in CI)

**我需要完成的功能：**

| Priority | Feature | PRD Reference | Description |
|----------|---------|---------------|-------------|
| P0 | Onboarding Flow | FR-1 ~ FR-4 | Welcome screen → dietary chips, household size, taste prefs, language selector → "Create" / "Skip" |
| P0 | Profile Editing Page | FR-5, FR-7 | 编辑 dietary_restrictions, household_size, language_preference, taste_preferences |
| P1 | Checkbox + Strikethrough | FR-11 | 替换当前的 emerald highlight，使用 checkbox + 删除线表示 checked items |
| P1 | Collapsible Sections | FR-15 | Section 可折叠/展开 |
| P1 | Per-Item AI Buttons | FR-12, FR-38, FR-42, FR-46 | 每个 item 行上显示 Inspire / Alternatives / Item Info 按钮，点击展开 inline panel |
| P2 | Smart View (Suggest UI) | FR-25 ~ FR-33 | Recipe cluster 展示、Keep/Dismiss/Keep All actions、context block、More button |
| P2 | Auto-Translation on Add | FR-17 | 添加 item 时自动调用 translate API 填充 `name_secondary` |
| P3 | Sample Data on First Launch | FR-8 | 新用户首次登录时展示 demo sections + items |

**前端测试任务：**

| Task | Description |
|------|-------------|
| 提高 unit test 覆盖率 | 当前只有 3 个 test files，需要达到 70% coverage threshold |
| 启用 E2E tests in CI | 4 个 Playwright specs 已写好但 commented out，需要 enable 并确保 pass |
| 新功能的测试 | Onboarding, profile editing, collapsible sections 等新功能的 unit + E2E tests |

---

### 2.2 API Gateway (Priority: LOW — 队友已基本完成)

**现状：** Gateway 路由、JWT、CORS、rate limiting 全部就位。

**我只需要：**

| Task | Description |
|------|-------------|
| Review & 确认 | 通读 `services/api-gateway/src/` 确认 routes 与后端 service 对齐 |
| 添加 Metrics 埋点 | Request count, latency histogram, error rate (详见 §2.4) |
| WebSocket 修复 | 和做 List Service 的队友协调，等他加上 `/ws` endpoint 后确认 Gateway relay 工作正常 |
| 补充 Gateway Tests | 当前只有 1 个 integration test，补充更多 route-level tests |

---

### 2.3 CI/CD Pipeline (Priority: MEDIUM)

**已完成：**
- `.github/workflows/ci.yml` — 5 个 service jobs (lint + build + test)
- Path-based concurrency control
- `ci-pass` gate job for branch protection
- Husky + lint-staged pre-commit hooks

**我需要完成：**

| Priority | Task | Description |
|----------|------|-------------|
| P0 | Enable E2E in CI | 取消 Playwright 步骤的 comment，配置 full stack 环境 (docker compose) 或 mock backend |
| P1 | Docker Image Build | 为每个 service 添加 CI step：build Docker image → push to registry (GHCR) |
| P1 | Coverage Enforcement | 确保 web `test:coverage` 在 CI 中 enforce 70% threshold（当前已配置但代码覆盖率可能不够） |
| P2 | Deployment Pipeline | 添加 deploy stage (staging env)，可以是 K8s deploy 或 docker compose on a VPS |
| P2 | Integration Test Stage | 加一个 CI stage 在 docker compose 环境中跑 cross-service integration tests |
| P3 | Notifications | CI 失败时通知（GitHub Actions + Slack/Discord webhook） |

---

### 2.4 Metrics Instrumentation (Priority: HIGH — 课程要求)

课程后期需要性能分析，因此需要提前在代码中埋入 metrics 采集点。

**推荐 Stack：**
- **Prometheus client** — 各 service 暴露 `/metrics` endpoint
  - Web/Gateway (Node.js): `prom-client`
  - Go services: `prometheus/client_golang`
  - Python service: `prometheus-fastapi-instrumentator` 或 `prometheus_client`
- **Grafana** (可选) — 本地开发时可视化
- 也可以用简单的 structured logging (JSON logs + timestamps) 作为轻量级替代

**我负责的 Metrics 埋点范围：**

#### Web Frontend
| Metric | Type | Description |
|--------|------|-------------|
| `page_load_time` | Histogram | 页面加载时间 |
| `api_call_duration` | Histogram | 前端发起的 API 调用延迟 (per endpoint) |
| `api_call_errors` | Counter | API 调用失败次数 (per endpoint, per status code) |
| `user_interaction` | Counter | 关键用户操作计数 (add_item, suggest, inspire, etc.) |

#### API Gateway
| Metric | Type | Description |
|--------|------|-------------|
| `http_request_duration_seconds` | Histogram | 请求延迟 (per route, per method, per status) |
| `http_requests_total` | Counter | 请求总数 (per route, per method, per status) |
| `upstream_request_duration_seconds` | Histogram | Gateway 到各下游 service 的转发延迟 |
| `rate_limit_hits_total` | Counter | 触发 rate limit 的次数 |
| `active_websocket_connections` | Gauge | 活跃 WebSocket 连接数 |

**需要和队友协调的 Metrics：**

告诉队友在他们的 service 中也加入以下埋点：

| Service | Key Metrics |
|---------|-------------|
| User Service (Go) | `http_request_duration_seconds`, `db_query_duration_seconds`, `auth_failures_total` |
| List Service (Go) | `http_request_duration_seconds`, `db_query_duration_seconds`, `rabbitmq_publish_duration_seconds`, `items_per_section` |
| AI Service (Python) | `ai_request_duration_seconds` (per tier), `ai_token_usage`, `cache_hit_rate`, `rabbitmq_consume_duration`, `openrouter_latency_seconds` |

---

## 3. Team Collaboration Plan

### 3.1 Team Division (Based on CICD-and-ProjectSetup-Plan.md)

| Member | Responsibility | Label |
|--------|---------------|-------|
| 队友 A | AI Service (Python/FastAPI) — tiered inference, 3-step reasoning, experiments | `area/ai-service` |
| **我 (William)** | Web Frontend, API Gateway, CI/CD, Infra | `area/frontend`, `area/infra` |
| 队友 B | User Service, List Service (Go/Gin) | `area/backend` |

### 3.2 Interface Contracts (我和队友之间的关键接口)

**我依赖队友 A (AI Service) 的：**
- Suggest API 的 response format — 目前是 flat list `{name_en, category, reason}`，如果改成 recipe clusters 格式，前端需要同步改
- 新增的 tiered inference 是否改变了 API contract（应该不会，对前端透明）
- Experiment 1 结果决定 prompt 格式 → 影响 Smart View UI 的展示逻辑

**我依赖队友 B (Backend Services) 的：**
- List Service 的 WebSocket endpoint (`/ws`) — Gateway relay 依赖它
- `checked` field 的 toggle API (PUT item with `checked: true/false`) — checkbox 功能需要
- 任何新增的 API endpoint 需要同步在 Gateway 加路由

**队友依赖我的：**
- CI pipeline 正常工作 — 他们每次 push 都会跑 CI
- Docker image build — 他们需要测试 docker compose full stack
- 前端 UI 展示他们的 API 数据 — 他们需要看到效果

### 3.3 Collaboration Workflow

```
1. 每个 feature 开一个 branch: feat/<area>/<feature-name>
2. PR 必须通过 CI (5 jobs all green) + 1 review
3. 涉及跨 service 的改动：先在 PR description 中说明 interface 变化，tag 相关队友 review
4. Metrics 埋点：各自在自己的 service 中加，约定统一的 metric naming convention
5. Weekly sync: 对齐 API contract 变化、blockers、experiment progress
```

---

## 4. Suggested Execution Order

### Week 1 (Mar 25 – Mar 28) — Foundation
- [ ] Review API Gateway code，确认所有 routes 正确
- [ ] 在 API Gateway 中集成 `prom-client`，添加 request metrics
- [ ] 在 Web `api.ts` 中添加 API call timing instrumentation
- [ ] 完成 Onboarding Flow UI (welcome → profile setup → redirect to list)
- [ ] 完成 Profile Editing Page

### Week 2 (Mar 29 – Apr 4) — Core UX
- [ ] Checkbox + Strikethrough 替换 emerald highlight
- [ ] Collapsible Sections
- [ ] Per-Item AI Buttons (inline expand panel)
- [ ] 提高 unit test 覆盖率到 70%
- [ ] Enable E2E tests in CI

### Week 3 (Apr 5 – Apr 11) — Smart View + CI
- [ ] Smart View UI (recipe clusters, Keep/Dismiss, context block) — 依赖队友 A 完成 structured response format
- [ ] Auto-translation on item add
- [ ] Docker image build in CI
- [ ] 配合队友做 Experiment 3 的 load testing (前端/Gateway 的 metrics 数据采集)

### Week 4 (Apr 12 – Apr 18) — Polish
- [ ] Sample data on first launch
- [ ] 前端性能分析报告 (基于 metrics 数据)
- [ ] CI/CD 完善 (deployment pipeline if needed)
- [ ] Final cleanup, demo video 录制

---

## 5. Key Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Smart View 依赖 AI response 格式变化 | 前端 UI 需要大改 | 和队友 A 提前约定 response schema，用 TypeScript type 锁定 |
| E2E in CI 需要 full stack | CI 时间变长，依赖 docker compose | 可以先用 mock backend，或只在 merge to main 时跑 E2E |
| Metrics 增加代码复杂度 | 可能引入 bug | 用成熟的库 (prom-client)，metrics 代码与业务逻辑分离 |
| 前端测试覆盖率不足 | CI 失败阻塞 merge | 优先补充核心组件 (api.ts, auth-context, list page) 的测试 |
| WebSocket 功能依赖队友 B | 实时同步无法做 | 先跳过 WebSocket，用 polling 作为 fallback |
