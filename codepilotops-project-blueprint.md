# CodePilotOps Project Blueprint

## 1. Project Positioning

**CodePilotOps** is an AI-powered pull request risk analysis platform for Java and Spring Boot projects.

It connects to GitHub repositories, listens to pull request events, analyzes code changes, detects delivery risks, and generates structured AI review reports that can be posted back to GitHub.

The project is designed for individual developers, small engineering teams, and open-source maintainers who want better release confidence when AI-assisted coding increases development speed.

## 2. Why This Project Is Worth Building

This project fits several strong software engineering trends:

- AI-assisted software development is becoming mainstream, but generated code still needs review, testing, and delivery checks.
- Engineering teams are moving from simple CI pipelines to intelligent developer platforms.
- Java and Spring Boot remain widely used in enterprise backend systems.
- GitHub-based automation is a practical and visible open-source integration point.
- Kubernetes, Docker, observability, and delivery risk analysis are valuable resume signals.

Unlike a generic chatbot or CRUD system, this project demonstrates real engineering depth:

- GitHub App and webhook integration
- Diff parsing and risk classification
- LLM-based structured report generation
- Rule engine design
- Java backend architecture
- Async task processing
- Docker-based local deployment
- Optional Kubernetes manifests as advanced documentation

## 3. Target Users

### Primary Users

- Java backend developers
- Small engineering teams using GitHub
- Open-source maintainers
- Developers experimenting with AI-assisted coding workflows

### User Pain Points

- Pull requests are reviewed manually and inconsistently.
- AI-generated code may introduce hidden risks.
- Test coverage and migration risks are easy to miss.
- Infrastructure files such as Dockerfile and Kubernetes YAML are rarely reviewed carefully.
- Teams want useful review summaries instead of noisy static analysis reports.

## 4. MVP Scope

The one-month MVP should focus on a working end-to-end flow:

1. Connect a GitHub repository.
2. Receive or simulate a pull request event.
3. Fetch pull request diff.
4. Run deterministic risk rules.
5. Generate an AI review report.
6. Display the result in a Vue dashboard.
7. Optionally post a summary comment back to GitHub.

## 5. Core Features

### 5.1 Repository Connection

Support two modes:

- MVP mode: user manually enters GitHub owner, repo, pull request number, and token.
- Advanced mode: GitHub webhook receives pull request events.

For a one-month project, build MVP mode first, then add webhook support.

### 5.2 Pull Request Diff Analyzer

Analyze changed files and classify them by type:

- Java source files
- Spring configuration files
- SQL migration files
- Dockerfile
- Docker Compose files
- Kubernetes YAML files
- GitHub Actions workflow files
- Markdown and documentation files

Output a normalized change model:

```json
{
  "repository": "owner/repo",
  "pullRequestNumber": 12,
  "changedFiles": [
    {
      "path": "src/main/java/com/example/UserController.java",
      "type": "JAVA",
      "additions": 45,
      "deletions": 8
    }
  ]
}
```

### 5.3 Rule-Based Risk Scanner

Start with practical rules that are easy to explain in a resume.

Recommended MVP rules:

| Rule ID | Target | Description | Severity |
|---|---|---|---|
| JAVA_CONTROLLER_WITHOUT_TEST | Java | Controller changed but no related test file changed | Medium |
| JAVA_SERVICE_WITHOUT_TEST | Java | Service changed but no related test file changed | Medium |
| SPRING_SECRET_IN_CONFIG | Config | Possible secret detected in application config | High |
| SQL_MIGRATION_WITHOUT_ROLLBACK | SQL | Migration changed but rollback hint missing | Medium |
| DOCKER_LATEST_TAG | Dockerfile | Uses latest tag in base image | Medium |
| DOCKER_ROOT_USER | Dockerfile | Container may run as root | Medium |
| K8S_MISSING_PROBES | Kubernetes | Deployment has no liveness or readiness probe | High |
| K8S_NO_RESOURCE_LIMITS | Kubernetes | Container has no resource limits | Medium |
| GITHUB_ACTION_UNPINNED_ACTION | GitHub Actions | Action version is not pinned | Low |

Each rule should produce:

```json
{
  "ruleId": "K8S_MISSING_PROBES",
  "severity": "HIGH",
  "filePath": "k8s/deployment.yaml",
  "message": "Deployment does not define livenessProbe or readinessProbe.",
  "recommendation": "Add health probes to reduce release risk."
}
```

### 5.4 AI Review Report

The AI should not replace the rule engine. It should turn structured findings into a readable engineering review.

Recommended report sections:

- Summary
- Overall risk score
- Key risks
- Suggested tests
- Release notes
- Rollback considerations
- Recommended reviewer focus

Recommended output format:

```json
{
  "summary": "This PR changes user-facing API logic and deployment configuration.",
  "riskLevel": "MEDIUM",
  "riskScore": 68,
  "keyRisks": [],
  "suggestedTests": [],
  "releaseNotes": [],
  "rollbackPlan": []
}
```

Use structured output rather than free-form markdown as the internal format. The UI and GitHub comment can render it as markdown later.

### 5.5 Dashboard

Vue dashboard pages:

- Repository analysis form
- Analysis history
- Analysis detail page
- Rule findings table
- AI report panel
- Risk score visualization

Keep the UI practical and developer-focused. Avoid marketing pages.

### 5.6 GitHub Comment Integration

For MVP, support posting one PR summary comment.

The comment should include:

- Risk level
- Risk score
- Top findings
- Suggested tests
- Link to local dashboard if available

## 6. Recommended Tech Stack

### Backend

- Java 21
- Spring Boot 3
- Spring Web
- Spring Security
- Spring Data JPA
- PostgreSQL
- Redis, optional for async task state
- Flyway
- Spring AI or LangChain4j
- GitHub REST API
- Testcontainers
- JUnit 5

### Frontend

- Vue 3
- TypeScript
- Vite
- Pinia
- Vue Router
- Element Plus or Naive UI
- ECharts for risk charts

### Local Runtime

- Docker Compose
- PostgreSQL container
- Optional Ollama container or local Ollama process

### AI Provider Strategy

Support two provider modes:

- OpenAI-compatible API for better output quality
- Ollama for local demo and open-source friendliness

Recommended abstraction:

```java
public interface AiReviewClient {
    AiReviewReport generateReview(ReviewContext context);
}
```

Implementations:

- OpenAiReviewClient
- OllamaReviewClient
- MockReviewClient for tests and demos

## 7. Backend Module Design

Recommended package structure:

```text
com.codepilotops
  auth
  github
  repository
  analysis
  analysis.diff
  analysis.rules
  analysis.ai
  analysis.report
  webhook
  common
```

### Main Components

#### GitHub Module

Responsibilities:

- Fetch pull request metadata
- Fetch changed files
- Fetch diff or patch content
- Post PR comment

#### Analysis Module

Responsibilities:

- Create analysis job
- Track analysis status
- Run diff classification
- Run rule scanner
- Trigger AI report generation
- Persist final report

#### Rule Engine

Responsibilities:

- Load enabled rules
- Execute rules by file type
- Normalize findings

Recommended interface:

```java
public interface RiskRule {
    String ruleId();
    boolean supports(ChangeFile file);
    List<RiskFinding> evaluate(ChangeFile file, AnalysisContext context);
}
```

#### AI Module

Responsibilities:

- Build prompt context
- Call selected AI provider
- Parse structured JSON response
- Fallback to safe mock report on provider error

## 8. Database Design

### repositories

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| owner | varchar | GitHub owner |
| name | varchar | GitHub repo name |
| default_branch | varchar | Optional |
| created_at | timestamp | Created time |

### analysis_jobs

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| repository_id | uuid | FK |
| pull_request_number | int | PR number |
| status | varchar | PENDING, RUNNING, COMPLETED, FAILED |
| risk_level | varchar | LOW, MEDIUM, HIGH |
| risk_score | int | 0-100 |
| error_message | text | Failure reason |
| created_at | timestamp | Created time |
| completed_at | timestamp | Completed time |

### changed_files

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| analysis_job_id | uuid | FK |
| path | varchar | File path |
| file_type | varchar | JAVA, SQL, K8S, DOCKER, etc. |
| additions | int | GitHub additions |
| deletions | int | GitHub deletions |
| patch | text | Optional patch content |

### risk_findings

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| analysis_job_id | uuid | FK |
| rule_id | varchar | Rule ID |
| severity | varchar | LOW, MEDIUM, HIGH |
| file_path | varchar | Related file |
| message | text | Finding message |
| recommendation | text | Suggested fix |

### ai_review_reports

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| analysis_job_id | uuid | FK |
| provider | varchar | openai, ollama, mock |
| model | varchar | Model name |
| summary | text | Summary |
| report_json | jsonb | Full structured report |
| created_at | timestamp | Created time |

## 9. API Design

### Create Analysis

```http
POST /api/analyses
Content-Type: application/json

{
  "owner": "spring-projects",
  "repo": "spring-petclinic",
  "pullRequestNumber": 123,
  "githubToken": "ghp_xxx"
}
```

### Get Analysis Detail

```http
GET /api/analyses/{analysisId}
```

### List Analysis Jobs

```http
GET /api/analyses
```

### Post GitHub Comment

```http
POST /api/analyses/{analysisId}/github-comment
```

### GitHub Webhook

```http
POST /api/webhooks/github
```

## 10. AI Prompt Design

System prompt:

```text
You are an experienced Java backend reviewer and release risk analyst.
You review pull request changes based on structured rule findings and changed files.
Return only valid JSON matching the required schema.
Focus on delivery risk, missing tests, rollback concerns, and reviewer attention points.
Do not invent files or facts not present in the input.
```

User prompt context:

```text
Repository: {owner}/{repo}
Pull Request: #{number}

Changed files:
{changedFilesJson}

Rule findings:
{riskFindingsJson}

Generate a structured risk review report.
```

## 11. One-Month Roadmap

### Week 1: Project Foundation

Goals:

- Create backend Spring Boot project
- Create Vue frontend project
- Add Docker Compose with PostgreSQL
- Implement database migrations
- Implement GitHub API client for changed files
- Implement manual analysis creation API

Deliverable:

- User can enter owner, repo, PR number, token and create an analysis job.

### Week 2: Rule Engine

Goals:

- Implement file type classifier
- Implement rule engine interface
- Add 6-9 MVP rules
- Store changed files and findings
- Build analysis detail API
- Add basic Vue pages

Deliverable:

- User can view changed files, findings, severity, and risk score.

### Week 3: AI Review

Goals:

- Add AI provider abstraction
- Implement OpenAI-compatible provider
- Implement Ollama or mock provider
- Add structured AI report parsing
- Render AI report in frontend
- Add retry and error handling

Deliverable:

- User can generate and view an AI review report for a real PR.

### Week 4: GitHub Integration and Open Source Polish

Goals:

- Add GitHub PR comment posting
- Add webhook endpoint, optional
- Add Docker Compose production-like setup
- Add README, architecture diagram, screenshots
- Add GitHub Actions CI
- Add tests with Testcontainers

Deliverable:

- Project is ready to publish on GitHub with a strong README and demo flow.

## 12. GitHub README Structure

Recommended English README sections:

```text
# CodePilotOps

AI-powered pull request risk analysis for Java and Spring Boot projects.

## Features
## Demo
## Architecture
## Quick Start
## Configuration
## AI Providers
## Rule Catalog
## API Reference
## Development
## Roadmap
## License
```

The README should include:

- Screenshot of dashboard
- Example PR review comment
- Architecture diagram
- Docker Compose quick start
- Example environment variables
- Rule catalog table

## 13. Resume Description

Recommended resume project title:

**CodePilotOps: AI-Powered Pull Request Risk Analysis Platform**

Recommended resume bullets:

- Built an AI-powered pull request risk analysis platform for Java and Spring Boot repositories using Spring Boot 3, Java 21, Vue 3, PostgreSQL, and Docker.
- Integrated GitHub REST APIs to fetch pull request diffs, classify changed files, and post structured AI review comments back to pull requests.
- Designed a rule engine to detect delivery risks across Java code, Spring configuration, SQL migrations, Dockerfiles, Kubernetes manifests, and GitHub Actions workflows.
- Implemented an LLM-based review pipeline with structured JSON output, provider abstraction, prompt templates, and fallback mock provider for local demos.
- Added Docker Compose, Flyway migrations, Testcontainers-based integration tests, and CI workflow to make the project reproducible and open-source friendly.

## 14. Suggested Repository Name

Good options:

- codepilotops
- pr-risk-ai
- ai-pr-guardian
- spring-pr-reviewer
- release-risk-copilot

Recommended final name:

**codepilotops**

It is broad enough for future expansion and memorable enough for GitHub.

## 15. Scope Control

Do not build these in the first month:

- Full multi-tenant SaaS billing
- Complex organization permission model
- Real-time collaboration
- Custom workflow language
- Full static code analysis engine
- Full Kubernetes operator

Optional stretch goals after MVP:

- GitHub App installation flow
- RAG over team engineering guidelines
- SARIF export
- Slack notification
- Helm chart
- OpenTelemetry metrics
- Rule configuration UI
- Multi-language support

