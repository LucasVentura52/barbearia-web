# Barbearia Web (Vue + Vite)

Frontend da plataforma de barbearia.

## Arquivos de ambiente

- `.env.development`: configuração usada no `npm run dev`
- `.env.production`: configuração usada no `npm run build`
- `.env.example`: referência de desenvolvimento
- `.env.development.example`: referência de desenvolvimento
- `.env.production.example`: referência de produção

Variáveis usadas:

- `VITE_API_URL`: URL base da API
- `VITE_COMPANY_SLUG`: slug padrão da empresa

## Desenvolvimento

1. Instale dependências:

```bash
npm install
```

2. Verifique se `.env.development` aponta para a API local:

```env
VITE_API_URL=http://127.0.0.1:8000
VITE_COMPANY_SLUG=default
```

3. Rode o projeto:

```bash
npm run dev
```

## Produção

1. Ajuste `.env.production` (ou variáveis no provedor) com a URL real da API.
2. Gere o build:

```bash
npm run build
```

3. Publique a pasta `dist`.

## Deploy no Render (Static Site)

- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- Env vars mínimas:
  - `VITE_API_URL=https://barbearia-api-uhux.onrender.com`
  - `VITE_COMPANY_SLUG=default`
