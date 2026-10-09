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
  IA: ['Bedrock (Claude)', 'Bedrock (Nova Canvas)', 'Strands Agents', 'Gemini', 'OCR'],
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

/** Serviços AWS distintos (pro contador do hero). */
export function isAwsService(item: string): boolean {
  return groupOf.get(item) === 'AWS' || item.startsWith('Bedrock')
}
