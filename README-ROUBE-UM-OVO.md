# Roube um Ovo 3D – multiplayer por salas

Implantação isolada na branch `roube-um-ovo-3d-multiplayer`. A branch principal da NOVA IA permanece intacta.

Render: runtime Node, `npm install --omit=dev`, `npm start`, health endpoint `/health`. Configure `ADMIN_PASSWORD_HASH` como variável de ambiente privada, contendo o SHA-256 hexadecimal da senha do ADMIN. Sem a variável as salas funcionam, mas ações ADMIN remotas ficam bloqueadas.

O jogo ainda está em versão multiplayer inicial: movimento e eventos são transmitidos por sala. Ovos e inventários continuam locais.

## Executar o projeto

Com Node.js 18 ou superior instalado, abra um terminal nesta pasta e execute:

```sh
npm install
npm start
```

Abra `http://localhost:3000`. Para atualizar uma hospedagem existente, envie o projeto completo, incluindo `egg-hatching.js`, `egg-hatching.css`, `halloween-clowns.js` e a pasta `audio`.

## Chocar ovos e pular

1. Pegue um ovo e leve-o ao círculo de depósito da sua base.
2. Aguarde a incubação. Ao ficar pronto, ele permanece na incubadora e aparece o botão **Chocar ovo**.
3. Toque no botão: a casca se abre com o som enviado, o animal aparece completamente branco com o áudio de suspense e depois revela suas cores e seu nome.
4. Toque em **Continuar** para voltar ao jogo. O pet é salvo antes da animação para não se perder ao fechar ou recarregar.

No celular, use o joystick para andar e **Pular** para saltar. No computador, use WASD/setas, Espaço para pular e E para agir. O salto também funciona após terminar o atordoamento de uma colisão.

Admin e eventos de chocagem instantânea podem antecipar a incubação; várias revelações aparecem em sequência. O evento e a música de Halloween continuam presentes; a música fica mais baixa durante a revelação para destacar os dois efeitos.

## Palhaços e risada de bruxa

Há cinco palhaços fazendo a dança do L: dois junto da sua base e três pelos biomas. Eles levantam a mão em L na testa e alternam os chutes e saltinhos. Os dois da base acompanham a posição da sua base ao entrar em uma sala.

A música enviada em `videoplayback.webm` está em `audio/clown-dance.webm`. Ela começa ao chegar a menos de 8 unidades de um palhaço, repete em loop e pausa ao se afastar mais de 11 unidades. O volume acompanha a distância. Os palhaços compartilham uma faixa para evitar músicas sobrepostas.

A risada enviada em `risada-de-bruxa.mp3` está em `audio/witch-laugh.mp3`. Ela toca aleatoriamente pelo mapa, mesmo longe dos palhaços: a primeira ocorre entre 20 e 45 segundos depois da primeira interação; as próximas, entre 35 e 80 segundos após a anterior terminar. A risada não fica em loop.

Os dois sons novos pausam durante a revelação de um ovo e quando o jogo vai para segundo plano. A música dos palhaços retorna se você ainda estiver perto ao voltar. A música de Halloween fica mais baixa para destacar os sons novos. Palhaços e risadas não dependem da data de encerramento do evento de Halloween.

## Verificação

`npm test` executa os testes de lógica, salvamento, salto e multiplayer. Para o teste visual, instale `playwright` (`npm install --no-save playwright` e `npx playwright install chromium`) e execute `npm run test:hatching`. Ele verifica celular na vertical e horizontal e computador, com capturas em `test-results/hatching`.

`npm run test:clowns` verifica os palhaços em celular e computador, a repetição real da música, a distância, a risada independente e a pausa dos sons durante a chocagem. Capturas ficam em `test-results/clowns`.
