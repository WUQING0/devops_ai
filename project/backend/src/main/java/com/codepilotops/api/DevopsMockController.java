package com.codepilotops.api;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://127.0.0.1:5173", "http://localhost:5173"})
public class DevopsMockController {

    @GetMapping("/health")
    public ApiResponse<Map<String, Object>> health() {
        return ok(mapOf(
                "status", "UP",
                "service", "codepilotops-backend",
                "timestamp", Instant.now().toString()
        ));
    }

    @GetMapping("/dashboard")
    public ApiResponse<Map<String, Object>> dashboard() {
        return ok(mapOf(
                "metrics", Arrays.asList(
                        metric("本月 AI 审核次数", "1,286", "较上月提升 18.4%"),
                        metric("高风险 PR", "17", "其中 5 个阻断合并"),
                        metric("代码片段分析", "312", "模板命中率 82%"),
                        metric("模型调用成本", "$42.8", "本月预算使用 36%")
                ),
                "jobs", analysisJobs()
        ));
    }

    @GetMapping("/analyses")
    public ApiResponse<List<Map<String, Object>>> analyses() {
        return ok(analysisJobs());
    }

    @GetMapping("/analyses/demo")
    public ApiResponse<Map<String, Object>> analysisDetail() {
        return ok(mapOf(
                "repository", "spring-projects/spring-petclinic",
                "pullRequest", "#123",
                "riskLevel", "MEDIUM",
                "riskScore", 68,
                "summary", "本次 PR 修改了用户接口逻辑和 Kubernetes 部署配置。AI 建议重点关注接口测试覆盖、健康检查缺失、Docker 镜像版本漂移以及上线后的回滚路径。",
                "findings", riskFindings(),
                "policyDecision", "REQUIRE_HUMAN_CONFIRMATION"
        ));
    }

    @GetMapping("/repositories")
    public ApiResponse<List<Map<String, Object>>> repositories() {
        return ok(Arrays.asList(
                mapOf(
                        "platform", "GitHub",
                        "repository", "spring-projects/spring-petclinic",
                        "defaultBranch", "main",
                        "autoScan", "PR 创建 / 更新 / 合并前",
                        "template", "Java 后端代码质量基线",
                        "status", "NORMAL"
                ),
                mapOf(
                        "platform", "GitLab",
                        "repository", "platform/order-service",
                        "defaultBranch", "develop",
                        "autoScan", "MR 创建 / 更新",
                        "template", "支付核心变更评审标准",
                        "status", "NORMAL"
                )
        ));
    }

    @PostMapping("/analyses")
    public ApiResponse<Map<String, Object>> createAnalysis(@RequestBody Map<String, Object> request) {
        return ok(mapOf(
                "analysisId", "demo-analysis-001",
                "status", "COMPLETED",
                "riskLevel", "MEDIUM",
                "riskScore", 68,
                "received", request
        ));
    }

    @PostMapping("/code-analysis")
    public ApiResponse<Map<String, Object>> analyzeCode(@RequestBody Map<String, Object> request) {
        return ok(mapOf(
                "riskLevel", "MEDIUM",
                "scores", mapOf(
                        "security", 72,
                        "testGap", 64,
                        "maintainability", 38
                ),
                "findings", Arrays.asList(
                        "方法允许直接修改用户角色，需要确认调用方是否具备权限校验。",
                        "邮箱字段缺少格式校验和唯一性冲突处理。",
                        "未记录关键字段变更审计日志，不利于企业权限变更追踪。"
                ),
                "suggestions", Arrays.asList(
                        "增加角色变更权限校验。",
                        "补充 UserService 单元测试和 Controller 集成测试。",
                        "对角色变更写入审计事件。"
                ),
                "received", request
        ));
    }

    @GetMapping("/templates")
    public ApiResponse<List<Map<String, Object>>> templates() {
        return ok(Arrays.asList(
                template("Java 后端代码质量基线", "代码质量", "启用", "检查异常处理、事务边界、空值处理、日志、测试覆盖和可维护性。"),
                template("依赖升级风险评估", "依赖治理", "启用", "检查版本漂移、CVE、许可证、破坏性升级和传递依赖变化。"),
                template("Kubernetes 生产发布基线", "发布风险", "需确认", "检查探针、资源限制、副本数、安全上下文、镜像标签和灰度策略。"),
                template("支付核心变更评审标准", "业务功能", "自定义", "对支付、权限、资金字段、幂等和审计日志进行专项评审。")
        ));
    }

    @GetMapping("/model-metrics")
    public ApiResponse<Map<String, Object>> modelMetrics() {
        return ok(mapOf(
                "callCount", 348,
                "averageLatency", "2.4s",
                "failureRate", "1.3%",
                "todayCost", "$3.7"
        ));
    }

    private List<Map<String, Object>> analysisJobs() {
        return Arrays.asList(
                job("GitHub", "spring-projects/spring-petclinic", "#123", "feature/user-api -> main", "MEDIUM", 68, 5, "需补充接口测试与健康检查", "COMPLETED"),
                job("GitHub", "acme/api-gateway", "#42", "fix/security-header -> release/1.8", "HIGH", 86, 9, "建议阻断合并，存在配置泄露风险", "COMPLETED"),
                job("GitLab", "platform/order-service", "!18", "feature/payment-refactor -> develop", "LOW", 22, 1, "变更范围可控，建议常规回归", "RUNNING")
        );
    }

    private List<Map<String, Object>> riskFindings() {
        return Arrays.asList(
                finding("HIGH", "K8S_MISSING_PROBES", "k8s/deployment.yaml", "Deployment 未配置 livenessProbe 或 readinessProbe。"),
                finding("MEDIUM", "JAVA_CONTROLLER_WITHOUT_TEST", "src/main/java/.../UserController.java", "Controller 发生变更，但未发现关联测试文件变更。"),
                finding("MEDIUM", "DOCKER_LATEST_TAG", "Dockerfile", "基础镜像使用 latest 标签，存在不可重复构建风险。")
        );
    }

    private Map<String, Object> metric(String label, String value, String note) {
        return mapOf("label", label, "value", value, "note", note);
    }

    private Map<String, Object> job(String platform, String repository, String pullRequest, String branch, String riskLevel, int score, int findings, String conclusion, String status) {
        return mapOf(
                "platform", platform,
                "repository", repository,
                "pullRequest", pullRequest,
                "branch", branch,
                "riskLevel", riskLevel,
                "score", score,
                "findings", findings,
                "conclusion", conclusion,
                "status", status
        );
    }

    private Map<String, Object> finding(String severity, String ruleId, String filePath, String message) {
        return mapOf("severity", severity, "ruleId", ruleId, "filePath", filePath, "message", message);
    }

    private Map<String, Object> template(String name, String category, String status, String description) {
        return mapOf("name", name, "category", category, "status", status, "description", description);
    }

    private <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(data);
    }

    private Map<String, Object> mapOf(Object... values) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 0; i < values.length; i += 2) {
            map.put(String.valueOf(values[i]), values[i + 1]);
        }
        return map;
    }
}
