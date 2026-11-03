# Modo Missão: Android e Windows

Este projeto gera dois apps a partir do mesmo código (`www/index.html`):

- **Android:** um APK instalável, feito com Capacitor. Ele manda notificações agendadas mesmo com o app fechado.
- **Windows:** um instalador `.exe` e uma versão portátil, feitos com Electron. O app fica na bandeja, inicia junto com o Windows e manda notificações.
- **Bônus:** a mesma pasta `www` também funciona como site instalável (PWA) se você publicar na Vercel.

```
www/               app (HTML único, manifest, service worker, ícones)
api/sistema.js     servidor da IA (função da Vercel)
desktop/           app do Windows (Electron)
assets/            ícones e splash do Android
capacitor.config.json, package.json   app Android (Capacitor)
.github/workflows/build.yml           gera APK e EXE na nuvem
```

---

## 1. Gerar os apps sem instalar nada (GitHub Actions)

Esse é o caminho mais fácil: o GitHub compila tudo pra você.

1. Crie um repositório no GitHub. Pode ser privado.
2. Suba esta pasta inteira pra ele. Dá pra arrastar os arquivos pelo site, usar o GitHub Desktop ou rodar `git push`. A pasta `.github` precisa ir junto.
3. No repositório, abra a aba **Actions**, escolha **Gerar apps (Android e Windows)** e clique em **Run workflow**. O workflow também roda sozinho a cada push na branch `main`.
4. Espere uns 10 minutos. Quando terminar, abra a execução e baixe os artefatos no fim da página:
   - **ModoMissao-Android:** vem com o `app-debug.apk`.
   - **ModoMissao-Windows:** vem com o instalador e a versão portátil.

### Instalar no Android
1. Mande o `.apk` pro celular.
2. Abra o arquivo e permita "instalar apps de fontes desconhecidas" quando o Android pedir.
3. Abra o app e vá em **Status › Notificações › Ativar**. Aceite a permissão.
4. Se o celular economizar bateria de forma agressiva (Xiaomi, Samsung, Motorola), coloque o Modo Missão como "sem restrição" de bateria. Assim as notificações chegam no horário.

### Instalar no Windows
1. Rode o `ModoMissao-...-nsis.exe`. Como o app não tem assinatura digital paga, o SmartScreen vai mostrar um aviso. Clique em **Mais informações › Executar assim mesmo**.
2. Fechar a janela não encerra o app: ele continua no ícone ao lado do relógio e cobra as missões. Pra sair de vez, clique com o botão direito no ícone e escolha **Sair**.
3. O app já vem configurado pra iniciar com o Windows. Dá pra desligar no mesmo menu do ícone.

---

## 2. Ligar a IA (terminal, receitas, álbuns, assuntos)

Fora do Claude, a IA precisa de um servidor seu. Sem servidor, o app funciona em modo offline: as missões, o registro, as notificações e o backup funcionam normal, e as receitas, os álbuns e os assuntos saem de uma lista fixa. Só o terminal fica sem resposta.

1. Crie uma chave em **console.anthropic.com** (API Keys). A API é paga por uso, então coloque um limite de gasto mensal no painel.
2. Na **Vercel**, use **Add New › Project** e importe o mesmo repositório do GitHub. As configurações de build já estão no `vercel.json`.
3. Em **Settings › Environment Variables**, crie:
   - `ANTHROPIC_API_KEY`: a chave do passo 1.
   - `APP_TOKEN`: uma senha que você inventa. Ela impede que outras pessoas usem seu servidor.
4. Faça o deploy. Você vai ganhar um endereço como `https://modo-missao.vercel.app`.
5. Em cada app, vá em **Status › Servidor do sistema**, cole o endereço e a senha, toque em **Salvar** e depois em **Testar conexão**.

Os modelos usados são `claude-sonnet-5-5` (terminal) e `claude-haiku-5-5` (receitas, álbuns e assuntos). Dá pra trocar pelas variáveis `MODEL_DEFAULT` e `MODEL_QUICK`.

Esse mesmo endereço da Vercel também abre o app no navegador. No Chrome, use **Instalar app**. Nessa versão de navegador, as notificações só chegam com o app aberto.

---

## 3. Levar seu progresso do Claude pros apps

Cada aparelho guarda os próprios dados.

1. No app dentro do Claude, vá em **Status › Backup › Gerar código de backup › Copiar**.
2. No celular ou no PC, vá em **Status › Backup › Importar backup**, cole o código e confirme.

Use o mesmo caminho pra passar o progresso do celular pro PC e vice-versa.

---

## 4. Compilar no seu computador (opcional)

Você vai precisar do Node.js 20+.

**Windows:**
```
cd desktop
npm install
npm start        # abre o app pra testar
npm run dist     # gera os .exe em desktop/dist
```

**Android:** você vai precisar também do Android Studio e do JDK 21.
```
npm install
npx cap add android
npm run android:icons
npx cap sync android
npx cap open android   # no Android Studio: Build › Build APK(s)
```
Depois de mudar `www/index.html`, rode `npx cap sync android` de novo.

As versões das dependências estão no `package.json`. Se alguma der erro de instalação no futuro, suba pra versão mais nova da mesma linha.
