# CodePilotOps Backend

Spring Boot backend for CodePilotOps.

## Current Runtime

This project currently uses:

- Java 11
- Spring Boot 2.7.18
- Maven

Reason:

The local machine currently has `D:\jdk11` and `D:\maven\apache-maven-3.5.2`. Spring Boot 3 requires Java 17+, so the first backend iteration uses Spring Boot 2.7 for local compatibility.

Future upgrade target:

- Java 21
- Spring Boot 3.x

## Run

```powershell
$env:JAVA_HOME='D:\jdk11'
$env:PATH='D:\jdk11\bin;D:\maven\apache-maven-3.5.2\bin;' + $env:PATH
mvn spring-boot:run
```

Backend URL:

```text
http://127.0.0.1:8080
```

Health check:

```text
GET /api/health
```

## Implemented Mock APIs

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/analyses`
- `GET /api/analyses/demo`
- `GET /api/repositories`
- `POST /api/analyses`
- `POST /api/code-analysis`
- `GET /api/templates`
- `GET /api/model-metrics`

These APIs are mock implementations for frontend integration. Later iterations should replace them with real GitHub/GitLab, rule engine, and AI provider services.
