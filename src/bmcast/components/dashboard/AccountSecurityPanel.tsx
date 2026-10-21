import React, { useState } from 'react';
import { KeyRound, Lock, ShieldCheck, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/authService';

type Section = 'password' | 'recovery' | 'delete' | null;

interface Props {
  onAccountDeleted: () => void;
}

const inputCls =
  'w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 transition-colors';

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
    setCurrent(''); setNewPass(''); setConfirm(''); setQuestion(''); setAnswer(''); setDeleteText('');
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
      const res =
        open === 'password'
          ? await authService.changePassword(current, newPass)
          : open === 'recovery'
            ? await authService.changeRecovery(current, question, answer)
            : await authService.deleteAccount(current);
      if (!res.success) {
        setMsg({ ok: false, text: res.error || 'Não foi possível concluir.' });
        return;
      }
      if (open === 'delete') {
        onAccountDeleted();
        return;
      }
      setMsg({ ok: true, text: open === 'password' ? 'Senha alterada com sucesso!' : 'Pergunta de recuperação atualizada!' });
      setCurrent(''); setNewPass(''); setConfirm(''); setQuestion(''); setAnswer('');
    } finally {
      setBusy(false);
    }
  };

  const items: { id: Exclude<Section, null>; label: string; icon: typeof Lock; danger?: boolean }[] = [
    { id: 'password', label: 'Alterar senha', icon: Lock },
    { id: 'recovery', label: 'Mudar pergunta de recuperação', icon: KeyRound },
    { id: 'delete', label: 'Excluir conta', icon: Trash2, danger: true },
  ];

  return (
    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
        <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
        <span>Conta &amp; Segurança</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {items.map(({ id, label, icon: Icon, danger }) => (
          <button
            key={id}
            type="button"
            onClick={() => reset(id)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-full border text-[11px] font-semibold transition-colors cursor-pointer ${
              open === id
                ? danger
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'bg-sky-600 border-sky-600 text-white'
                : danger
                  ? 'border-red-300 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
                  : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {open && (
        <form onSubmit={submit} autoComplete="off" className="space-y-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          {open === 'delete' && (
            <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold">
              Isso apaga sua conta, slides, telas e configurações deste aparelho. Não dá para desfazer.
            </p>
          )}
          <input type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Senha atual" className={inputCls} />
          {open === 'password' && (
            <>
              <input type="password" required minLength={6} autoComplete="new-password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Nova senha (mínimo 6)" className={inputCls} />
              <input type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repita a nova senha" className={inputCls} />
            </>
          )}
          {open === 'recovery' && (
            <>
              <input type="text" required minLength={5} maxLength={200} autoComplete="off" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Nova pergunta (ex: Cidade onde nasci?)" className={inputCls} />
              <input type="text" required minLength={2} maxLength={100} autoComplete="off" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Resposta" className={inputCls} />
            </>
          )}
          {open === 'delete' && (
            <input type="text" required autoComplete="off" value={deleteText} onChange={(e) => setDeleteText(e.target.value)} placeholder="Digite EXCLUIR para confirmar" className={inputCls} />
          )}
          {msg && (
            <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${msg.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {msg.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              <span>{msg.text}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            className={`w-full py-2.5 rounded-full text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 ${open === 'delete' ? 'bg-red-600 hover:bg-red-500' : 'bg-sky-600 hover:bg-sky-500'}`}
          >
            {busy ? 'Aguarde...' : open === 'password' ? 'Salvar nova senha' : open === 'recovery' ? 'Salvar pergunta' : 'Excluir minha conta'}
          </button>
        </form>
      )}
    </div>
  );
};
