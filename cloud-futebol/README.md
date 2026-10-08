# Cloud Futebol — Android
Aplicativo experimental independente para Android. Exibe controles de toque sobre xbox.com/play por meio de WebView e emula um gamepad por JavaScript.

**Atenção**: protótipo não testado com streaming real. O site Xbox pode rejeitar um controle emulado via Gamepad API, apresentar problemas de autenticação via WebView ou abrir vídeo em fullscreen que oculte a interface. O APK compilar com sucesso não comprova que o jogo responde aos toques.

## Instalação
Abra a execução de GitHub Actions da branch cloud-futebol-app e baixe o artefato CloudFutebol-APK. Extraia o APK e instale no celular caso confie no código. O botão 🎮 ativa/desativa os controles.

## Segurança e privacidade
Sem SDK de anúncios ou rastreadores próprios. App carrega o Xbox no WebView, onde a conta é autenticada diretamente pela Microsoft. Nunca envie a senha por mensagem. Projeto independente da Xbox/Microsoft.

## Compilação
cd cloud-futebol
gradle :app:assembleDebug
