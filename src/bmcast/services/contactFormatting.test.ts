import test from 'node:test';
import assert from 'node:assert/strict';
import { formatWhatsApp, normalizeInstagram, editableCompanyName } from './contactFormatting';

test('formatWhatsApp formats Brazilian phone numbers correctly', () => {
  assert.equal(formatWhatsApp('11987654321'), '(11) 98765-4321');
  assert.equal(formatWhatsApp('(11) 98765-4321'), '(11) 98765-4321');
  assert.equal(formatWhatsApp(''), '');
  assert.equal(formatWhatsApp('11'), '(11');
});

test('normalizeInstagram strips unwanted symbols and excess @', () => {
  assert.equal(normalizeInstagram('@@minha.empresa'), 'minha.empresa');
  assert.equal(normalizeInstagram('@loja_oficial'), 'loja_oficial');
  assert.equal(normalizeInstagram('@'), '');
});

test('editableCompanyName clears placeholder Minha Empresa', () => {
  assert.equal(editableCompanyName('Minha Empresa'), '');
  assert.equal(editableCompanyName('Hamburgueria Gourmet'), 'Hamburgueria Gourmet');
});
