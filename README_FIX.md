# BM CAST - Sistema de TV & Mídia Indoor (Corrigido e Atualizado)

Este projeto foi 100% revisado, corrigido e configurado com suporte oficial ao Supabase, Tema Claro/Escuro nativo e layout responsivo sem cortes.

## O que foi corrigido:
1. **Tema Claro e Escuro 100% Funcional (`themeService.ts` + Tailwind v4):**
   - Removidas as regras CSS conflitantes (`.app-shell`) que quebravam o contraste de botões e textos no modo claro.
   - Sincronização instantânea e persistente entre Login, Cadastro, Recuperação de Senha, Cabeçalho do Painel e todos os Modais (`SupabaseSettingsModal`, `ConfirmModal`, `BrandSettingsModal`, `WeatherModal`, `TickerSettingsModal`, `SlideCustomizerModal`, `ConnectTVModal`, `TutorialModal`).
2. **Correção Completa de Layout e Responsividade (`DashboardHeader.tsx`):**
   - Cabeçalho reestruturado em barra principal + barra utilitária de estação para eliminar estouro horizontal (botões `Criar Slide`, `Conectar TV`, alternador `Claro/Escuro` e `Sair` sempre visíveis em telas 1024px–1920px+ e gaveta mobile limpa).
3. **Fluxo de Configuração Guiada e Criação de Slides:**
   - Corrigido o fluxo passo a passo (`Empresa -> Clima -> Letreiro -> Primeiro Slide`) para avançar ao salvar e encerrar corretamente ao cancelar.
   - Liberada a publicação de slides com fundo sólido colorido (sem exigir foto obrigatória), ativação automática da etiqueta de destaque (`badgeText`), selo de desconto e opacidade de fundo sincronizados no `TVPlayer`.
   - Imagens locais de alta definição (`/demo-burger.jpg` e `/demo-pizza.jpg`) incluídas no projeto (sem links externos quebrados).
4. **Integração Real com o Supabase (`@supabase/supabase-js`):**
   - Suporte a chaves `sb_publishable_` e sincronização híbrida Offline-First + Realtime (`supabase_realtime`), sem erros 404 repetidos antes da criação das tabelas.
   - Script SQL completo incluído em `supabase-schema.sql`.

## Como ativar as tabelas no seu Supabase:
1. Acesse o painel do seu projeto Supabase: [SQL Editor](https://supabase.com/dashboard/project/dkjjgszyrkhdcrwycaej/sql)
2. Abra o arquivo `supabase-schema.sql` (ou copie pelo botão dentro do painel em **Banco Supabase > Copiar Script SQL**).
3. Cole no SQL Editor do Supabase e clique em **Run**.

## Como rodar localmente:
```bash
npm install
npm run dev
```
Acesse `http://localhost:3000`.
