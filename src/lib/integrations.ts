export type IntegrationProvider = 'ocr' | 'whatsapp' | 'jobs_portal' | 'email' | 'ideia_signer'
export type IntegrationStatus = 'stub' | 'configured' | 'error'

export interface IntegrationConfigRequirement {
  key: string
  label: string
  required: boolean
  description: string
}

export interface IntegrationAdapterStatus {
  provider: IntegrationProvider
  name: string
  status: IntegrationStatus
  description: string
  requirements: IntegrationConfigRequirement[]
}

export interface OcrRequest {
  fileUrl: string
  documentType?: string
}

export interface WhatsAppMessageRequest {
  phone: string
  message: string
}

export interface JobPostingRequest {
  title: string
  description: string
  location?: string
}

export interface EmailRequest {
  to: string
  subject: string
  body: string
}

export interface SignatureRequest {
  signerName: string
  signerEmail: string
  documentUrl: string
}

function missingProvider(provider: string) {
  return {
    ok: false,
    provider,
    mode: 'stub',
    message: 'Adapter em modo stub. Configure as credenciais do provedor real antes de enviar dados externos.',
  }
}

export const integrationAdapters = {
  ocr: {
    async extractDocument(_payload: OcrRequest) {
      return missingProvider('ocr')
    },
  },
  whatsapp: {
    async sendMessage(_payload: WhatsAppMessageRequest) {
      return missingProvider('whatsapp')
    },
  },
  jobsPortal: {
    async publishJob(_payload: JobPostingRequest) {
      return missingProvider('jobs_portal')
    },
  },
  email: {
    async sendEmail(_payload: EmailRequest) {
      return missingProvider('email')
    },
  },
  ideiaSigner: {
    async requestSignature(_payload: SignatureRequest) {
      return missingProvider('ideia_signer')
    },
  },
}

export const integrationCatalog: IntegrationAdapterStatus[] = [
  {
    provider: 'ocr',
    name: 'OCR de documentos',
    status: 'stub',
    description: 'Leitura automática de RG, CPF, comprovantes e anexos de colaboradores.',
    requirements: [
      { key: 'OCR_PROVIDER', label: 'Provedor OCR', required: true, description: 'Nome do provedor escolhido.' },
      { key: 'OCR_API_KEY', label: 'Chave de API', required: true, description: 'Credencial de autenticação do OCR.' },
      { key: 'OCR_WEBHOOK_SECRET', label: 'Webhook secret', required: false, description: 'Validação de callbacks de processamento.' },
    ],
  },
  {
    provider: 'whatsapp',
    name: 'WhatsApp',
    status: 'stub',
    description: 'Envio de mensagens para candidatos e colaboradores.',
    requirements: [
      { key: 'WHATSAPP_PROVIDER', label: 'Provedor WhatsApp', required: true, description: 'Meta Cloud API, Z-API, Twilio ou similar.' },
      { key: 'WHATSAPP_TOKEN', label: 'Token', required: true, description: 'Token de envio das mensagens.' },
      { key: 'WHATSAPP_PHONE_ID', label: 'Phone ID', required: true, description: 'Identificador do número remetente.' },
    ],
  },
  {
    provider: 'jobs_portal',
    name: 'Portal de vagas',
    status: 'stub',
    description: 'Publicação e sincronização de vagas em portais externos.',
    requirements: [
      { key: 'JOBS_PORTAL_PROVIDER', label: 'Portal', required: true, description: 'Gupy, Kenoby, Pandape, LinkedIn ou portal próprio.' },
      { key: 'JOBS_PORTAL_API_KEY', label: 'Chave de API', required: true, description: 'Credencial de publicação de vagas.' },
      { key: 'JOBS_PORTAL_WEBHOOK_URL', label: 'Webhook', required: false, description: 'URL para receber candidatos externos.' },
    ],
  },
  {
    provider: 'email',
    name: 'E-mail transacional',
    status: 'stub',
    description: 'Envio de comunicados, holerites e avisos automáticos.',
    requirements: [
      { key: 'EMAIL_PROVIDER', label: 'Provedor', required: true, description: 'Resend, SendGrid, SMTP ou similar.' },
      { key: 'EMAIL_API_KEY', label: 'Chave de API', required: true, description: 'Credencial de envio.' },
      { key: 'EMAIL_FROM', label: 'Remetente', required: true, description: 'Endereço autorizado para envio.' },
    ],
  },
  {
    provider: 'ideia_signer',
    name: 'Ideia Signer',
    status: 'stub',
    description: 'Envio de contratos e documentos para assinatura digital.',
    requirements: [
      { key: 'IDEIA_SIGNER_API_URL', label: 'URL da API', required: true, description: 'Endpoint do serviço de assinatura.' },
      { key: 'IDEIA_SIGNER_API_KEY', label: 'Chave de API', required: true, description: 'Credencial para criar envelopes.' },
      { key: 'IDEIA_SIGNER_WEBHOOK_SECRET', label: 'Webhook secret', required: false, description: 'Validação de eventos de assinatura.' },
    ],
  },
]
