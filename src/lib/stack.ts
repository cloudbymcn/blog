/** Vocabulário permitido de stack (SPEC §7). Frontmatter `stack:` só aceita estes nomes. */
export const STACK = {
  AWS: [
    'AWS Lambda',
    'API Gateway',
    'EventBridge',
    'S3',
    'CloudFront',
    'DynamoDB',
    'Cognito',
    'SES',
    'SQS',
    'Step Functions',
    'Bedrock',
    'MediaConvert',
    'EC2',
    'AWS Batch',
    'Secrets Manager',
    'CloudWatch',
    'SAM',
    'CDK',
    'IAM',
    'VPC',
    'KMS',
    'SNS',
    'Systems Manager',
    'ACM',
    'X-Ray',
    'Amplify',
    'Textract',
    'Location Service',
    'Cost Explorer',
    'GuardDuty',
    'CloudTrail',
    'Compute Optimizer',
    'Rekognition',
  ],
  'IaC/DevOps': ['Terraform', 'SST', 'GitHub Actions', 'Docker', 'PowerShell', 'Bash', 'Nginx'],
  Linguagens: ['Python', 'TypeScript', 'JavaScript', 'Node.js', 'SQL'],
  Front: ['React', 'Next.js', 'Vite', 'Tailwind', 'shadcn/ui', 'three.js', 'PWA'],
  'Dados/Integrações': [
    'Firebird',
    'DuckDB',
    'Salesforce',
    'SharePoint/Graph API',
    'Microsoft 365',
    'OpenAPI',
  ],
  IA: [
    'Claude Code',
    'Codex',
    'Antigravity',
    'Maestri',
    'JEV',
    'Strands Agents',
    'Bedrock (Claude)',
    'Bedrock (Nova)',
    'Bedrock (Nova Canvas)',
    'Bedrock (Titan)',
    'Gemini',
    'OCR',
  ],
  // ferramentas do dia a dia do Matheus (editor, notas, Python, versionamento)
  Ferramentas: ['VS Code', 'Obsidian', 'uv', 'Git', 'GitHub'],
} as const

export type StackGroup = keyof typeof STACK
export type StackItem = (typeof STACK)[StackGroup][number]

export const ALL_STACK: readonly string[] = Object.values(STACK).flat()

const groupOf = new Map<string, StackGroup>(
  (Object.entries(STACK) as [StackGroup, readonly string[]][]).flatMap(([g, items]) =>
    items.map((i) => [i, g] as const),
  ),
)

export function stackGroup(item: string): StackGroup | undefined {
  return groupOf.get(item)
}

/** Serviços AWS distintos (stats.awsServices); os modelos do Bedrock contam como serviço AWS. */
export function isAwsService(item: string): boolean {
  return groupOf.get(item) === 'AWS' || item.startsWith('Bedrock')
}

/** Nome do serviço pro contador: Bedrock (Claude/Nova/Titan…) é um serviço só. */
export function awsServiceName(item: string): string {
  return item.startsWith('Bedrock') ? 'Bedrock' : item
}
