/**
 * Utilitário de Comunicação para o Radar Beta
 * Suporta geração de links de WhatsApp e simulação de envio de Email.
 */

export interface MessagePayload {
  to: string;
  name: string;
  subject?: string;
  body: string;
  vaga?: string;
  empresa?: string;
}

export const Communication = {
  /**
   * Substitui variáveis no corpo da mensagem
   */
  replaceVariables: (text: string, data: Partial<MessagePayload>) => {
    return text
      .replace(/{{nome_candidato}}/g, data.name || '')
      .replace(/{{vaga}}/g, data.vaga || '')
      .replace(/{{empresa}}/g, data.empresa || 'Rede Ideia')
      .replace(/{{data}}/g, new Date().toLocaleDateString('pt-BR'));
  },

  /**
   * Gera um link do WhatsApp com a mensagem formatada
   */
  generateWhatsAppLink: (phone: string, message: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMsg = encodeURIComponent(message);
    return `https://wa.me/55${cleanPhone}?text=${encodedMsg}`;
  },

  /**
   * Simula o envio de email (abre o cliente de email do usuário)
   */
  sendEmail: (payload: MessagePayload) => {
    const body = encodeURIComponent(payload.body);
    const subject = encodeURIComponent(payload.subject || 'Contato — Recrutamento');
    window.location.href = `mailto:${payload.to}?subject=${subject}&body=${body}`;
  }
};
