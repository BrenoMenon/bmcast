import QRCode from 'qrcode';

export const qrService = {
  /**
   * Normaliza qualquer link inserido pelo usuário para que a câmera do celular
   * sempre reconheça como URL navegável (adiciona https:// se necessário)
   */
  normalizeUrl(rawText: string): string {
    if (!rawText || rawText.trim() === '') {
      return 'https://bmcast.app';
    }
    const trimmed = rawText.trim();

    // Já possui protocolo explícito (http, https, tel, mailto, etc.)
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed) || trimmed.startsWith('tel:') || trimmed.startsWith('mailto:')) {
      return trimmed;
    }

    // Se começa com wa.me
    if (trimmed.startsWith('wa.me/')) {
      return `https://${trimmed}`;
    }

    // Se parece com um domínio (ex: seusite.com, google.com.br, www.meusite.com)
    if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(trimmed)) {
      return `https://${trimmed}`;
    }

    // Se forem dígitos de telefone com DDD (10 ou 11 dígitos)
    const digitsOnly = trimmed.replace(/\D/g, '');
    if (digitsOnly.length >= 10 && digitsOnly.length <= 13 && !trimmed.includes(' ')) {
      return `https://wa.me/55${digitsOnly.replace(/^55/, '')}`;
    }

    return trimmed;
  },

  /**
   * Gera uma imagem DataURL (PNG) de alta resolução do QR Code
   */
  async generateDataUrl(
    text: string,
    colorDark = '#000000',
    colorLight = '#ffffff'
  ): Promise<string> {
    const formattedUrl = this.normalizeUrl(text);

    try {
      return await QRCode.toDataURL(formattedUrl, {
        width: 480,
        margin: 2,
        color: {
          dark: colorDark,
          light: colorLight,
        },
        errorCorrectionLevel: 'H',
      });
    } catch (err) {
      console.error('Erro ao gerar QRCode:', err);
      return '';
    }
  },

  /**
   * Converte arquivo selecionado pelo usuário para Base64 DataURL
   */
  async fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  },
};
