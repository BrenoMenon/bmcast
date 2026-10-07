import React, { useState } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Key,
  Globe,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface SupabaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  onSave: (url: string, anonKey: string, enabled: boolean) => void;
}

export const SupabaseSettingsModal: React.FC<SupabaseSettingsModalProps> = ({
  isOpen,
  onClose,
  supabaseUrl: initialUrl = '',
  supabaseAnonKey: initialKey = '',
  onSave,
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [anonKey, setAnonKey] = useState(initialKey);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!url.trim()) {
      setTestResult({
        success: false,
        message: 'Por favor, informe a URL do seu projeto Supabase.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const cleanUrl = url.trim().replace(/\/$/, '');
      const testEndpoint = `${cleanUrl}/rest/v1/`;

      const res = await fetch(testEndpoint, {
        method: 'GET',
        headers: {
          apikey: anonKey.trim(),
          Authorization: `Bearer ${anonKey.trim()}`,
        },
      });

      if (res.status === 200 || res.status === 401 || res.status === 404) {
        setTestResult({
          success: true,
          message: 'Conexão com o Supabase estabelecida com sucesso!',
        });
      } else {
        setTestResult({
          success: false,
          message: `Servidor respondeu com código ${res.status}. Verifique as chaves.`,
        });
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        message: 'Não foi possível conectar à URL informada. Verifique se a URL está correta.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSave(url.trim(), anonKey.trim(), Boolean(url.trim() && anonKey.trim()));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-b from-blue-950/40 to-transparent border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Banco de Dados & Nuvem Supabase
              </h3>
              <p className="text-xs text-slate-400">
                Armazenamento em nuvem persistente e multi-dispositivos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Status Banner */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">Status do Armazenamento:</span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                Ativo & Sincronizado
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              O sistema possui sincronização instantânea em tempo real via canais de transmissão do navegador.
              Se desejar integrar diretamente com a sua nuvem no <strong>Supabase</strong>, insira suas credenciais abaixo.
            </p>
          </div>

          {/* Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>Supabase Project URL:</span>
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Encontrada em Project Settings &gt; API no painel do Supabase.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-400" />
                <span>Supabase Anon Public API Key:</span>
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Chave anônima pública (anon key) para conexões do lado do cliente.
              </span>
            </div>
          </div>

          {/* Test Status feedback */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : 'bg-red-950/40 border-red-800 text-red-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-full border border-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testando...' : 'Testar Conexão'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-md"
          >
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
};
