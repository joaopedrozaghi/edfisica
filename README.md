# EdFísica PRO — Guia de uso e publicação

App PWA estático de Educação Física: página de vendas (`/index.html`) + app offline (`/app/`).  
Sem build, sem servidor, sem banco de dados — abre direto no navegador.

---

## O que vem no projeto

| Pasta / Arquivo | O que é |
|---|---|
| `index.html` | Página de vendas (lê tudo de `config.js`) |
| `config.js` | **Único arquivo que você precisa editar** para mudar oferta, preços e links |
| `app/` | O app PWA completo (6 módulos) |
| `assets/` | CSS, fontes e imagens da página de vendas |
| `tests/` | Suite de testes (harness, calc, store, repo, router, data) |
| `_headers` | Cabeçalhos de segurança para Netlify |
| `robots.txt` | Permite rastreamento da página de vendas, bloqueia `/app/` e `/tests/` |

---

## Como editar a oferta — tudo em `config.js`

Abra `config.js` e mude apenas os campos que precisar. Cada campo tem um comentário explicando o que faz.

### Nome e frase principal
```js
product: {
  name: 'EdFísica PRO',       // aparece na página e no app
  shortName: 'EdFísica',
  tagline: 'Estude, treine e coma melhor em um só app',
}
```

### Preço
```js
price: {
  current: 27.90,             // preço que o comprador paga (use ponto decimal)
  anchor: null,               // preço "De" — use null se nunca cobrou esse valor (CDC art. 37)
  installmentsText: 'ou 4x de R$ 7,57',  // atualize junto com o preço
  paymentNote: 'Pagamento único · Sem mensalidades',
}
```
Com `anchor: null` somem automaticamente "De", "Você economiza", "% OFF" e os valores riscados dos bônus.

### Link de checkout
```js
checkout: {
  url: 'https://SEU-CHECKOUT-AQUI',  // Hotmart, Kiwify, Eduzz etc.
}
```

### WhatsApp de suporte
```js
support: {
  whatsapp: '5511999999999',  // só dígitos, DDI + DDD + número
  message: 'Olá! Preciso de ajuda com o EdFísica PRO.',
}
```

### Contagem regressiva
```js
countdown: {
  enabled: true,   // mude para false se a condição não encerrar de verdade (CDC art. 37)
  minutes: 15,
  onExpire: 'hide',  // 'hide' = some ao zerar (recomendado)
}
```
> **Atenção:** Use o contador só se o preço ou os bônus mudarem de verdade ao encerrar.

### Depoimentos
```js
testimonials: {
  items: [
    // Exemplo (não aparece com nome):
    { example: true, text: 'Depoimento...', role: 'Estudante de Ed. Física' },
    // Real (substitua com autorização por escrito):
    { example: false, text: 'Texto real...', name: 'Maria S.', role: 'Professora', city: 'São Paulo' },
  ]
}
```
Substitua os itens `example: true` por depoimentos reais com autorização por escrito. Não invente nomes.

---

## O que NÃO vem do `config.js`

- Textos fixos da página de vendas (mockups de tela, seções "Para quem é", etc.) — editados direto no `index.html`
- Conteúdo do app (matérias, exercícios, alimentos, programas) — nos arquivos `app/data/`
- Visual (cores, fontes) — em `assets/css/style.css` e `app/css/app.css`

---

## Dois planos (Básico e Completo)

A página mostra dois planos. O **Completo** (destacado) usa `price.current` e `checkout.url`. O **Básico** fica em `plans.basic` (preço, parcelas e `checkoutUrl`). Para voltar a ter um plano só, use `plans.basic.enabled: false`.

Para o app saber o plano de cada comprador, ligue `access.requireCode: true` e crie **um código para cada plano**:
- hash do código do Completo em `access.codeHashes`
- hash do código do Básico em `access.basicCodeHashes`

Coloque cada código na mensagem de entrega do produto certo no checkout (Kiwify/Hotmart). Quem cria a conta com o código do Básico vê a tela "Disponível no plano Completo" ao abrir um bônus e pode liberar depois digitando o código do Completo.

## Login do app (e-mail e senha)

Ao abrir o app, cada pessoa cria a própria conta (nome, e-mail e senha) e depois entra com ela. Cada conta tem seus próprios dados (treinos, dieta, estudos). A senha nunca é guardada em texto: só um hash PBKDF2.

> As contas ficam **no aparelho** onde foram criadas (não há servidor). Trocar de celular = criar a conta de novo e importar o backup do Perfil. Não existe "esqueci a senha".

## Código de acesso na criação da conta (opcional, não é segurança real)

Para pedir o código da compra ao criar a conta:

```js
access: {
  requireCode: true,
  codeHashes: ['<hash>'],
}
```

Gere o hash do seu código (ex. `EDFPRO2024`):

```powershell
# PowerShell
$code = "EDFPRO2024"  # será convertido para maiúsculas automaticamente
$bytes = [System.Text.Encoding]::UTF8.GetBytes($code.ToUpper())
$sha = [System.Security.Cryptography.SHA256]::Create()
$hash = ($sha.ComputeHash($bytes) | ForEach-Object { $_.ToString("x2") }) -join ''
echo $hash
```

> **Aviso:** Essa barreira é para conveniência, não segurança real. Qualquer pessoa com o link do app consegue acessar o código-fonte.

---

## Testar localmente

Precisa de um servidor HTTP local (não abre `file://`):

```powershell
# Na pasta do projeto:
python -m http.server 8765
# Abra http://localhost:8765/index.html  (página de vendas)
# Abra http://localhost:8765/app/index.html  (app)
# Abra http://localhost:8765/tests/index.html  (testes)
```

---

## Publicar na Netlify (grátis, arraste a pasta)

1. Acesse [netlify.com/drop](https://app.netlify.com/drop)
2. Arraste a pasta `ofertaeducacaofisica` inteira para a área indicada
3. Aguarde o deploy (< 1 minuto)
4. Copie o URL gerado e atualize `site.url` em `config.js`
5. Copie o URL do app (`<seusite>.netlify.app/app/`) e atualize `site.appPath` se necessário

Para domínio próprio: vá em **Domain settings** no painel da Netlify.

---

## Rodar os testes

```powershell
# 1. Inicie o servidor (veja "Testar localmente")
# 2. Abra http://localhost:8765/tests/index.html no navegador
# Deve aparecer: ALL TESTS PASSED (N)

# Ou rode o validador Python (não precisa de Chrome):
python tests/run_headless.py
```

---

## Antes de lançar — checklist

- [ ] `config.js`: preenchi `product.name`, `price.current`, `checkout.url`
- [ ] `config.js`: `price.anchor` é `null` ou um preço que de fato pratiquei antes (CDC art. 37)
- [ ] `config.js`: `countdown.enabled: false` se a condição não encerrar de verdade
- [ ] `config.js`: `support.whatsapp` ou `support.email` preenchido
- [ ] Substituí os depoimentos de exemplo por depoimentos reais com autorização por escrito
- [ ] `seller.name` e `seller.document` (CNPJ/CPF) preenchidos no rodapé
- [ ] `legal.termsUrl` e `legal.privacyUrl` apontam para páginas reais (LGPD)
- [ ] Testei o link de checkout em modo anônimo
- [ ] Testei o app offline (instalei como PWA e desativei a internet)
- [ ] `site.url` atualizado com o domínio final
- [ ] Não há selos de "compra verificada" falsos nos depoimentos

---

## Créditos

Projeto gerado com EdFísica PRO template — PWA estático, vanilla ES modules, localStorage.  
Nenhuma dependência externa de runtime.
