export interface ApiResponse<T> {
  data: T
}

export interface DashboardMetric {
  label: string
  value: string
  note: string
}

export interface AnalysisJobDto {
  platform: string
  repository: string
  pullRequest: string
  branch: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  score: number
  findings: number
  conclusion: string
  status: string
}

export interface DashboardDto {
  metrics: DashboardMetric[]
  jobs: AnalysisJobDto[]
}

export interface CodeAnalysisResult {
  riskLevel: string
  scores: {
    security: number
    testGap: number
    maintainability: number
  }
  findings: string[]
  suggestions: string[]
}

export async function getDashboard(): Promise<DashboardDto> {
  const response = await fetch('/api/dashboard')
  if (!response.ok) {
    throw new Error(`Dashboard API failed: ${response.status}`)
  }
  const body = (await response.json()) as ApiResponse<DashboardDto>
  return body.data
}

export async function analyzeCode(code: string, template: string): Promise<CodeAnalysisResult> {
  const response = await fetch('/api/code-analysis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, template }),
  })
  if (!response.ok) {
    throw new Error(`Code analysis API failed: ${response.status}`)
  }
  const body = (await response.json()) as ApiResponse<CodeAnalysisResult>
  return body.data
}
