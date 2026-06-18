# CodePilotOps Frontend UI Design

## 1. Product UI Positioning

CodePilotOps should look like a practical developer platform, not a marketing website.

The first screen should be the actual working dashboard where a developer can start a pull request analysis immediately.

Design keywords:

- Developer-focused
- Dense but readable
- Quiet enterprise style
- Fast scanning
- Clear risk visibility
- English open-source UI copy

Recommended frontend stack:

- Vue 3
- TypeScript
- Vite
- Vue Router
- Pinia
- Element Plus
- ECharts

## 2. Visual Direction

### Layout

Use a classic application shell:

- Left sidebar navigation
- Top header with repository/provider status
- Main content area
- Detail drawer or secondary panel when needed

Avoid:

- Landing page hero
- Decorative gradients
- Large marketing cards
- Overly playful colors
- Nested cards

### Color System

Recommended palette:

| Token | Usage | Value |
|---|---|---|
| background | App background | #F7F8FA |
| surface | Main panels | #FFFFFF |
| border | Dividers | #E5E7EB |
| textPrimary | Main text | #111827 |
| textSecondary | Secondary text | #6B7280 |
| primary | Main actions | #2563EB |
| success | Low risk / completed | #16A34A |
| warning | Medium risk | #D97706 |
| danger | High risk / failed | #DC2626 |
| codeBg | Code blocks | #0F172A |

### Typography

Recommended:

- Font family: Inter, system-ui, sans-serif
- Page title: 22px / 28px
- Section title: 16px / 24px
- Body text: 14px / 22px
- Table text: 13px / 20px
- Code text: JetBrains Mono or ui-monospace

## 3. App Navigation

### Sidebar

Navigation items:

- Dashboard
- New Analysis
- Analysis History
- Rule Catalog
- Settings

Optional later:

- Repositories
- Webhooks
- AI Providers

### Route Design

| Route | Page | Purpose |
|---|---|---|
| / | Dashboard | Overview and recent analysis jobs |
| /analyses/new | New Analysis | Start PR analysis manually |
| /analyses | Analysis History | Search and filter past jobs |
| /analyses/:id | Analysis Detail | View changed files, findings, AI report |
| /rules | Rule Catalog | Show supported risk rules |
| /settings | Settings | GitHub token, AI provider, model config |

## 4. Page Designs

## 4.1 Dashboard

### Purpose

Give the user a fast overview of repository review health and recent analysis activity.

### Layout

```text
┌──────────────────────────────────────────────────────────────┐
│ Header: CodePilotOps                         Provider: Mock  │
├───────────────┬──────────────────────────────────────────────┤
│ Sidebar       │ Dashboard                                    │
│               │                                              │
│ Dashboard     │ [New Analysis]                               │
│ New Analysis  │                                              │
│ History       │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │
│ Rules         │ │ Jobs   │ │ High   │ │ Avg    │ │ Posted │ │
│ Settings      │ │ 128    │ │ 7      │ │ 54     │ │ 43     │ │
│               │ └────────┘ └────────┘ └────────┘ └────────┘ │
│               │                                              │
│               │ Recent Analysis Jobs                         │
│               │ ┌──────────────────────────────────────────┐ │
│               │ │ Repo | PR | Risk | Status | Created | >  │ │
│               │ └──────────────────────────────────────────┘ │
└───────────────┴──────────────────────────────────────────────┘
```

### Components

- Metric cards
- Recent analysis table
- Risk distribution chart
- Latest high-risk findings list

### Empty State

Text:

```text
No analysis jobs yet.
Start your first pull request risk analysis.
```

Primary button:

```text
New Analysis
```

## 4.2 New Analysis

### Purpose

Allow the user to manually run analysis against a GitHub pull request.

This should be the most important MVP page.

### Layout

```text
┌──────────────────────────────────────────────────────────────┐
│ New Analysis                                                  │
│ Analyze a GitHub pull request for delivery risks.             │
│                                                              │
│ Repository                                                    │
│ Owner             [ spring-projects              ]            │
│ Repository        [ spring-petclinic             ]            │
│ Pull Request #    [ 123                           ]            │
│ GitHub Token      [ ************************      ]            │
│                                                              │
│ Options                                                      │
│ [x] Run rule-based scan                                      │
│ [x] Generate AI review                                       │
│ [ ] Post comment to GitHub after analysis                    │
│                                                              │
│ AI Provider       [ Mock Provider v ]                         │
│                                                              │
│                                  [ Start Analysis ]           │
└──────────────────────────────────────────────────────────────┘
```

### Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| Owner | Text input | Yes | GitHub repository owner |
| Repository | Text input | Yes | Repository name |
| Pull Request # | Number input | Yes | Positive integer |
| GitHub Token | Password input | Optional in mock mode | Do not store by default in MVP |
| Run rule-based scan | Checkbox | Yes | Enabled by default |
| Generate AI review | Checkbox | Yes | Enabled by default |
| Post comment to GitHub | Checkbox | No | Disabled by default |
| AI Provider | Select | Yes | Mock, OpenAI-Compatible, Ollama |

### Validation

- Owner cannot be empty.
- Repository cannot be empty.
- Pull request number must be greater than 0.
- GitHub token is required when using GitHub API.
- AI provider config must be valid if AI review is enabled.

### Submit Behavior

After submit:

1. Create analysis job.
2. Navigate to `/analyses/:id`.
3. Show running state.
4. Poll job detail every 2-3 seconds until completed or failed.

## 4.3 Analysis History

### Purpose

Let users search and filter all previous analysis jobs.

### Layout

```text
Analysis History

[ Search repository or PR ] [ Risk: All v ] [ Status: All v ] [ Refresh ]

┌────────────────────────────────────────────────────────────────────┐
│ Repository        PR     Risk      Score   Findings   Status   ... │
│ spring-petclinic  #123   Medium    68      5          Done     >   │
│ demo-service      #42    High      86      9          Done     >   │
│ api-gateway       #18    Low       22      1          Done     >   │
└────────────────────────────────────────────────────────────────────┘
```

### Table Columns

| Column | Description |
|---|---|
| Repository | owner/repo |
| PR | Pull request number |
| Risk | LOW, MEDIUM, HIGH |
| Score | 0-100 |
| Findings | Count of rule findings |
| AI Provider | mock/openai/ollama |
| Status | Pending, Running, Completed, Failed |
| Created | Relative time |
| Action | View detail |

## 4.4 Analysis Detail

### Purpose

This is the core showcase page. It should clearly explain why the PR is risky and what the reviewer should do next.

### Page Header

```text
spring-projects/spring-petclinic #123
Risk Level: Medium     Score: 68     Status: Completed

[ Open PR ] [ Post GitHub Comment ] [ Re-run Analysis ]
```

### Layout

```text
┌──────────────────────────────────────────────────────────────┐
│ Analysis Detail                                               │
├──────────────────────────────────────────────────────────────┤
│ Risk Overview                                                 │
│ ┌───────────────┐ ┌────────────────────────────────────────┐ │
│ │ Score Gauge   │ │ AI Summary                             │ │
│ │ 68 Medium     │ │ This PR changes API logic and deploy... │ │
│ └───────────────┘ └────────────────────────────────────────┘ │
│                                                              │
│ Tabs: [ Findings ] [ Changed Files ] [ AI Review ] [ Raw ]   │
│                                                              │
│ Findings Table                                               │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Severity | Rule | File | Message | Recommendation | ...  │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Risk Overview

Show:

- Risk score gauge
- Risk level tag
- Total changed files
- Findings count by severity
- AI summary

### Tabs

#### Findings Tab

Main table for rule findings.

Columns:

- Severity
- Rule ID
- File path
- Message
- Recommendation

Use severity tags:

- Low: green
- Medium: amber
- High: red

#### Changed Files Tab

Show all changed files.

Columns:

- Path
- Type
- Additions
- Deletions
- Finding count

File type tags:

- JAVA
- SQL
- CONFIG
- DOCKER
- K8S
- GITHUB_ACTION
- DOC
- OTHER

#### AI Review Tab

Render structured AI report:

```text
Summary
This PR changes user-facing API logic and deployment configuration.

Key Risks
- Missing tests for changed controller logic.
- Kubernetes deployment has no readiness probe.

Suggested Tests
- Add controller integration tests for new endpoints.
- Verify rollback behavior for database migration.

Release Notes
- Requires careful deployment validation.

Rollback Plan
- Revert deployment manifest and database migration if health checks fail.
```

Actions:

- Copy Markdown
- Post GitHub Comment

#### Raw Tab

For developer trust and debugging:

- Raw changed files JSON
- Raw findings JSON
- Raw AI report JSON

This is useful for an open-source developer tool.

## 4.5 Rule Catalog

### Purpose

Show that the project has deterministic engineering logic, not only AI text generation.

### Layout

```text
Rule Catalog

[ Search rules ] [ Target: All v ] [ Severity: All v ]

┌──────────────────────────────────────────────────────────────────┐
│ Rule ID                       Target      Severity   Description │
│ K8S_MISSING_PROBES            K8S         High       ...         │
│ DOCKER_LATEST_TAG             Docker      Medium     ...         │
│ SPRING_SECRET_IN_CONFIG       Config      High       ...         │
└──────────────────────────────────────────────────────────────────┘
```

### Rule Detail Drawer

When clicking a rule:

- Rule ID
- Target file types
- Severity
- Description
- Example finding
- Recommendation

## 4.6 Settings

### Purpose

Configure local demo behavior.

### Sections

#### GitHub

Fields:

- Personal access token
- Default owner
- Default repository

For MVP, store token only in browser local storage or do not persist it at all.

#### AI Provider

Fields:

- Provider: Mock / OpenAI-Compatible / Ollama
- Base URL
- Model
- API key

Recommended defaults:

| Provider | Base URL | Model |
|---|---|---|
| Mock | N/A | mock-reviewer |
| Ollama | http://localhost:11434 | llama3.1 |
| OpenAI-Compatible | User configured | User configured |

#### Comment Template

Allow the user to preview GitHub PR comment markdown.

## 5. Component List

Recommended Vue component structure:

```text
src/
  app/
    AppShell.vue
    AppSidebar.vue
    AppHeader.vue
  pages/
    DashboardPage.vue
    NewAnalysisPage.vue
    AnalysisHistoryPage.vue
    AnalysisDetailPage.vue
    RuleCatalogPage.vue
    SettingsPage.vue
  components/
    RiskLevelTag.vue
    RiskScoreGauge.vue
    AnalysisStatusTag.vue
    FindingSeverityTag.vue
    ChangedFileTypeTag.vue
    AiReviewPanel.vue
    FindingsTable.vue
    ChangedFilesTable.vue
    JsonViewer.vue
    EmptyState.vue
  stores/
    analysisStore.ts
    settingsStore.ts
  api/
    analysisApi.ts
    settingsApi.ts
  router/
    index.ts
```

## 6. Frontend Data Models

### AnalysisJob

```ts
export interface AnalysisJob {
  id: string
  repository: string
  pullRequestNumber: number
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH'
  riskScore?: number
  findingCount: number
  createdAt: string
  completedAt?: string
}
```

### ChangedFile

```ts
export interface ChangedFile {
  id: string
  path: string
  fileType: 'JAVA' | 'SQL' | 'CONFIG' | 'DOCKER' | 'K8S' | 'GITHUB_ACTION' | 'DOC' | 'OTHER'
  additions: number
  deletions: number
  findingCount: number
}
```

### RiskFinding

```ts
export interface RiskFinding {
  id: string
  ruleId: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  filePath: string
  message: string
  recommendation: string
}
```

### AiReviewReport

```ts
export interface AiReviewReport {
  summary: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  riskScore: number
  keyRisks: string[]
  suggestedTests: string[]
  releaseNotes: string[]
  rollbackPlan: string[]
}
```

## 7. API Mapping

| UI Action | API |
|---|---|
| Start analysis | POST /api/analyses |
| Load analysis history | GET /api/analyses |
| Load analysis detail | GET /api/analyses/{id} |
| Post GitHub comment | POST /api/analyses/{id}/github-comment |
| Load rule catalog | GET /api/rules |

## 8. MVP Interaction Flow

```text
Open app
  -> Dashboard
  -> Click New Analysis
  -> Fill owner, repo, PR number, token
  -> Start Analysis
  -> Redirect to Analysis Detail
  -> Poll status while running
  -> Show findings and AI report
  -> Optional: post GitHub comment
```

## 9. Recommended First Implementation Order

1. App shell, sidebar, routing
2. New Analysis page
3. Analysis Detail page with mock data
4. Analysis History page
5. Risk tags and findings table
6. AI Review panel
7. API integration
8. Settings page
9. Rule Catalog page

## 10. MVP UI Acceptance Criteria

The frontend MVP is good enough when:

- A user can start a manual PR analysis from the UI.
- A running analysis shows loading and polling state.
- A completed analysis clearly shows risk score, findings, changed files, and AI review.
- Failed analysis shows a useful error message and retry action.
- The app works well on a 1440px desktop screen.
- The app remains usable on a 13-inch laptop screen.
- All visible UI copy is in English.
- No page looks like a placeholder or marketing landing page.

