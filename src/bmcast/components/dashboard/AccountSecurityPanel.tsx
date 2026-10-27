import React, { useState } from 'react';
import { KeyRound, Lock, ShieldCheck, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { storageService } from '../../services/storageService';

type Section = 'password' | 'recovery' | 'delete' | null;

interface Props {
  onAccountDeleted: () => void;
}

const inputCls =
  'w-full rounded-2xl border border-border bg-card px-3.5 py-2.5 text-base sm:text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition';

export const AccountSecurityPanel: React.FC<Props> = ({ onAccountDeleted }) => {
  const [open, setOpen] = useState<Section>(null);
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [deleteText, setDeleteText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const reset = (s: Section) => {
    setOpen((o) => (o === s ? null : s));
    setCurrent('');
    setNewPass('');
    setConfirm('');
    setQuestion('');
    setAnswer('');
    setDeleteText('');
    setMsg(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setMsg(null);

    if (open === 'password' && newPass !== confirm) {
      setMsg({ ok: false, text: 'As senhas não coincidem.' });
      return;
    }
    if (open === 'delete' && deleteText.trim().toUpperCase() !== 'EXCLUIR') {
      setMsg({ ok: false, text: 'Digite EXCLUIR para confirmar.' });
      return;
    }

    setBusy(true);
    try {
      if (open === 'delete') {
        const res = await authService.deleteAccount(current);
        if (!res.success) {
          setMsg({ ok: false, text: res.error || 'Não foi possível concluir.' });
          return;
        }
        await storageService.clearAll();
        try {
          sessionStorage.setItem(
            'bmcast_flash_msg',
            'Sua conta e todos os seus dados foram excluídos com sucesso.'
          );
        } catch {
          // ignore storage quota errors
        }
        setMsg({ ok: true, text: 'Conta excluída com sucesso!' });
        onAccountDeleted();
        return;
      }

      const res =
        open === 'password'
          ? await authService.changePassword(current, newPass)
          : await authService.changeRecovery(current, question, answer);

      if (!res.success) {
        setMsg({ ok: false, text: res.error || 'Não foi possível concluir.' });
        return;
      }

      setMsg({
        ok: true,
        text:
          open === 'password'
            ? 'Senha alterada com sucesso!'
            : 'Pergunta de recuperação atualizada!',
      });
      setCurrent('');
      setNewPass('');
      setConfirm('');
      setQuestion('');
      setAnswer('');
    } finally {
      setBusy(false);
    }
  };

  const items: { id: Exclude<Section, null>; label: string; icon: typeof Lock; danger?: boolean }[] = [
    { id: 'password', label: 'Alterar senha', icon: Lock },
    { id: 'recovery', label: 'Chave de recuperação', icon: KeyRound },
    { id: 'delete', label: 'Excluir conta', icon: Trash2, danger: true },
  ];

  return (
    <div className="space-y-2.5 border-t border-border pt-3.5">
      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
        <span>Conta &amp; Segurança</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {items.map(({ id, label, icon: Icon, danger }) => (
          <button
            key={id}
            type="button"
            onClick={() => reset(id)}
            className={`flex h-10 items-center justify-center gap-1.5 rounded-2xl border px-2.5 text-[11px] sm:text-xs font-semibold leading-none whitespace-nowrap transition cursor-pointer ${
              open === id
                ? danger
                  ? 'border-destructive bg-destructive text-destructive-foreground'
                  : 'border-primary bg-primary text-primary-foreground'
                : danger
                  ? 'border-destructive/35 text-destructive hover:bg-destructive/10'
                  : 'border-border bg-muted/40 text-foreground hover:bg-muted'
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="whitespace-nowrap">{label}</span>
          </button>
        ))}
      </div>

      {open && (
        <form
          onSubmit={submit}
          autoComplete="off"
          className="space-y-2.5 rounded-2xl border border-border bg-muted/40 p-3.5"
        >
          {open === 'delete' && (
            <p className="text-xs font-semibold text-destructive leading-relaxed">
              Isso apaga sua conta, slides, telas e configurações. Esta ação não pode ser desfeita.
            </p>
          )}

          <input
            type="password"
            required
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="Sua senha atual"
            className={inputCls}
          />

          {open === 'password' && (
            <>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Nova senha (mínimo 6 caracteres)"
                className={inputCls}
              />
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repita a nova senha"
                className={inputCls}
              />
            </>
          )}

          {open === 'recovery' && (
            <>
              <input
                type="text"
                required
                minLength={5}
                maxLength={200}
                autoComplete="off"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ex: Qual o nome do meu pet?"
                className={inputCls}
              />
              <input
                type="text"
                required
                minLength={2}
                maxLength={100}
                autoComplete="off"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Resposta secreta"
                className={inputCls}
              />
            </>
          )}

          {open === 'delete' && (
            <input
              type="text"
              required
              autoComplete="off"
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder="Digite EXCLUIR para confirmar"
              className={inputCls}
            />
          )}

          {msg && (
            <div
              className={`flex items-center gap-1.5 text-xs font-semibold ${
                msg.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
              }`}
            >
              {msg.ok ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              )}
              <span>{msg.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className={`w-full rounded-2xl py-2.5 text-xs font-bold transition cursor-pointer disabled:opacity-50 ${
              open === 'delete'
                ? 'bg-destructive text-destructive-foreground hover:opacity-95'
                : 'bg-primary text-primary-foreground hover:opacity-95'
            }`}
          >
            {busy
              ? 'Salvando...'
              : open === 'password'
                ? 'Salvar nova senha'
                : open === 'recovery'
                  ? 'Salvar chave de recuperação'
                  : 'Excluir minha conta'}
          </button>
        </form>
      )}
    </div>
  );
};
