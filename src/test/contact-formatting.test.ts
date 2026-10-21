import { describe, expect, it } from 'vitest';
import { editableCompanyName, formatWhatsApp, normalizeInstagram } from '../bmcast/services/contactFormatting';

describe('Contatos da empresa', () => {
  it('formata o celular como (xx) xxxxx-xxxx', () => {
    expect(formatWhatsApp('11987654321')).toBe('(11) 98765-4321');
    expect(formatWhatsApp('(11) 98765-4321')).toBe('(11) 98765-4321');
    expect(formatWhatsApp('')).toBe('');
  });
  it('não duplica arrobas no nome de usuário', () => {
    expect(normalizeInstagram('@@minha.loja')).toBe('minha.loja');
    expect(normalizeInstagram('@')).toBe('');
  });
  it('não preenche o nome da empresa com o exemplo', () => {
    expect(editableCompanyName('Minha Empresa')).toBe('');
    expect(editableCompanyName('Loja Real')).toBe('Loja Real');
  });
});