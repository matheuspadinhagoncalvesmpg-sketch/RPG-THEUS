# 🚀 Como publicar o THEUS na Hostinger

O jogo agora é **100% estático**: HTML, CSS e JavaScript que rodam no navegador. Não precisa de banco de dados, chave de API nem servidor rodando o tempo todo. O progresso fica salvo no próprio aparelho de quem joga.

---

## 📌 Opção 1: Hospedagem web comum (a mais simples, funciona em qualquer plano)

1. No hPanel, abra o **Gerenciador de Arquivos** do seu domínio (ou subdomínio, ex: `jogo.seudominio.com.br`).
2. Entre em `public_html` (ou na pasta do subdomínio).
3. Envie estes arquivos e pastas, mantendo a estrutura:
   ```
   index.html
   style.css
   manifest.json
   sw.js
   icon.svg
   src/        (a pasta inteira)
   ```
   Dica: compacte tudo num `.zip`, envie e use **Extrair** no próprio Gerenciador de Arquivos.
4. Ative o **SSL (HTTPS)** do domínio no hPanel. É necessário para o modo app (PWA) e a tela cheia no celular.
5. Pronto! Acesse o endereço pelo celular e use **Adicionar à tela inicial** para instalar como app.

> Não envie as pastas `tools/` e `.claude/`. Elas são só para desenvolvimento.

---

## 📌 Opção 2: Plano com Node.js (hPanel Cloud/Business ou VPS)

Também dá para usar o `server.js`, um servidor estático simples sem dependências:

1. Crie uma **Aplicação Node.js** no hPanel (Node 20 ou superior) com arquivo de inicialização `server.js`.
2. Envie os arquivos do jogo para a raiz da aplicação.
3. Clique em **Iniciar/Reiniciar**. Não há `npm install`, porque o projeto não tem dependências.

Num VPS:
```bash
cd /var/www/theus
pm2 start server.js --name theus
pm2 save
```
e configure o Nginx como proxy reverso para a porta 3000 (ou sirva a pasta direto pelo Nginx, já que é tudo estático).

---

## 🔄 Atualizando o jogo

Ao enviar uma versão nova, mude o nome do cache em `sw.js` (ex: `theus-v2.0.0` → `theus-v2.0.1`) para os celulares que instalaram o app baixarem a versão nova.
