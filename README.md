# AGA Resíduos v2 — Agenda de Coletas

Sistema completo de gestão de coletas de resíduos com registro de volumes por motorista.

## Stack

- React 18 + Vite
- Tailwind CSS
- Supabase (banco + storage de fotos)
- React Router v6
- Netlify (deploy)

## Estrutura

```
src/
  pages/
    Login.jsx              ← Tela de PIN (motorista e gestor)
    AgendaMotorista.jsx    ← Rota do dia para o motorista
    RegistroColeta.jsx     ← Formulário de registro com volumes + foto
    AgendaGestor.jsx       ← Calendário e agenda completa
    PainelGestor.jsx       ← CRUD clientes, motoristas, coletas, recorrências
    RelatorioCliente.jsx   ← Relatório por cliente com totais
  lib/
    supabase.js            ← Todas as funções do banco
    utils.js               ← Utilitários e constantes
  hooks/
    useAuth.js             ← Autenticação por PIN
```

## Como rodar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais do Supabase

# 3. Rodar em desenvolvimento
npm run dev

# 4. Build para produção
npm run build
```

## Deploy no Netlify

1. Suba o projeto no GitHub (novo repositório)
2. No Netlify → New site → Import from GitHub
3. Configurar:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Em **Environment variables** adicionar:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_PIN_GESTOR`

## Acessos

| Perfil    | PIN    | Tela inicial       |
|-----------|--------|--------------------|
| Gestor    | 1234   | Agenda completa    |
| Motorista | PIN individual (gerado pelo gestor no Painel) | Rota do dia |

## Fluxo do motorista

1. Login com PIN → Vê coletas do dia
2. Toca em um ponto → Tela de registro
3. Preenche volumes por tipo de resíduo (kg, L, unidades)
4. Tira foto opcional
5. Adiciona observação opcional
6. Confirma → Coleta marcada como Realizada

## Tipos de resíduo

**Recicláveis:** Papelão, Plástico, Filme Plástico, Metal, Vidro, Eletrônico, Óleo Vegetal, Óleo de Motor

**Outros:** Orgânico, Rejeito, Perigoso, Volumoso, Misto
