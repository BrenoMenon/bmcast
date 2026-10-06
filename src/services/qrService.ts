import QRCode from 'qrcode';

export const qrService = {
  /**
   * Gera uma imagem DataURL (PNG) de alta resolução do QR Code
   */
  async generateDataUrl(
    text: string,
    colorDark = '#000000',
    colorLight = '#ffffff'
  ): Promise<string> {
    if (!text || text.trim() === '') {
      text = 'https://bmcast.app';
    }
    try {
      return await QRCode.toDataURL(text, {
        width: 400,
        margin: 2,
        color: {
          dark: colorDark,
          light: colorLight,
        },
        errorCorrectionLevel: 'M',
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
