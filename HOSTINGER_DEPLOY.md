# 🚀 Guia de Implantação na Hostinger: RPG Multiplayer

Como o seu jogo possui um sistema **Multiplayer com WebSockets em tempo real**, ele precisa rodar o servidor **Node.js** (`server.js`).

---

## 📌 Cenário 1: Se você tem um plano com suporte a Node.js (hPanel Cloud ou Business)

A Hostinger possui a ferramenta **Aplicações Node.js** diretamente no hPanel:

1. **Acesse o hPanel** da Hostinger e selecione o seu domínio.
2. Na barra lateral ou de busca, procure por **Node.js**.
3. Clique em **Criar Aplicação Node.js**:
   - **Versão do Node.js**: Escolha `20.x` ou superior.
   - **Modo da Aplicação**: `Produção` (Production).
   - **Raiz do Aplicativo**: `/public_html` (ou a pasta do seu subdomínio).
   - **Arquivo de Inicialização da Aplicação**: `server.js`.
4. **Envie os arquivos**:
   - Acesse o **Gerenciador de Arquivos** no hPanel.
   - Envie os arquivos da pasta do jogo (`server.js`, `game.js`, `index.html`, `style.css`, `package.json`).
   - *(Dica: Compacte tudo em um `.zip` e descompacte direto no Gerenciador de Arquivos do hPanel)*.
5. **Instale as Dependências**:
   - De volta à tela do Node.js no hPanel, clique no botão **Instalar Dependências (NPM Install)**.
6. **Inicie a Aplicação**:
   - Clique em **Iniciar / Reiniciar Aplicação**.
   - Pronto! O jogo estará acessível diretamente no seu domínio com multiplayer ativo!

---

## 📌 Cenário 2: Se você tem um VPS na Hostinger (Melhor opção para Jogos)

Se o seu plano for um **VPS (KVM)** da Hostinger:

1. Conecte-se via SSH ao seu servidor:
   ```bash
   ssh root@seu-ip
   ```
2. Instale o Node.js e o PM2 (para manter o jogo online 24h mesmo após fechar o terminal):
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt-get install -y nodejs
   npm install -g pm2
   ```
3. Envie os arquivos do jogo para uma pasta (ex: `/var/www/rpg-mini`):
   ```bash
   cd /var/www/rpg-mini
   npm install
   ```
4. Inicie o jogo com o PM2:
   ```bash
   pm2 start server.js --name "rpg-adventure"
   pm2 startup
   pm2 save
   ```
5. Configure o Nginx como proxy reverso com suporte a WebSocket (porta 3000) e ative o SSL grátis (Certbot).

---

## 📌 Cenário 3: Se o seu plano Hostinger for apenas Hospedagem Web Simples (sem Node.js)

Planos compartilhados mais básicos (apenas PHP/HTML) não executam processos Node.js em segundo plano para o WebSocket. Nesse caso, a solução recomendada e 100% gratuita é:

1. **Subir o servidor multiplayer no Render.com (Gratuito)**:
   - Crie uma conta no [Render](https://render.com).
   - Conecte o repositório ou faça upload como **Web Service (Node.js)**.
   - Comando de inicialização: `npm start`.
   - O Render fornecerá uma URL HTTPS/WSS (ex: `https://meu-rpg.onrender.com`).
2. **Subir os arquivos estáticos (`index.html`, `style.css`, `game.js`) na Hostinger**:
   - Basta colocar a URL do Render no `game.js` e subir na pasta `public_html` da Hostinger.
