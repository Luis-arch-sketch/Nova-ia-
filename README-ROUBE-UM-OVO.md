# Roube um Ovo 3D – multiplayer por salas

Implantação isolada na branch `roube-um-ovo-3d-multiplayer`. A branch principal da NOVA IA permanece intacta.

Render: runtime Node, `npm install --omit=dev`, `npm start`, health endpoint `/health`. Configure `ADMIN_PASSWORD_HASH` como variável de ambiente privada, contendo o SHA-256 hexadecimal da senha do ADMIN. Sem a variável as salas funcionam, mas ações ADMIN remotas ficam bloqueadas.

O servidor controla os ovos compartilhados, coleta, devolução, depósito e cronômetros de cada sala. Dois jogadores não conseguem coletar o mesmo ovo. O ovo carregado aparece para os outros jogadores, assim como o estado das incubadoras da base. Pets, dinheiro e melhorias continuam no progresso local de cada jogador.

Conexões interrompidas tentam reconectar automaticamente, com limite entre as tentativas. A sessão recupera a base quando ela ainda está disponível, inclusive com o armazenamento bloqueado durante a mesma visita. Ovos carregados voltam à última posição conhecida ao desconectar. Depósitos usam um identificador e uma confirmação recuperável: perder a resposta e repetir o pedido não duplica o ovo. Salas vazias conservam o mapa por dois minutos para permitir a reconexão; depois são removidas. Reiniciar o processo do servidor cria novas salas e mapas, preservando o progresso já salvo no aparelho.

A sala de destino é validada antes da troca; se estiver cheia, o jogador permanece na anterior. Novos jogadores recebem o evento ativo com seu horário de término, e a reconexão não transporta eventos nem ovos de outra sala. ADMIN remoto é verificado novamente a cada conexão. Dados inválidos são ignorados, conexões mortas são removidas e a transmissão de movimento é agrupada a cada 100 ms.

Ao entrar numa sala ocupada, o jogador aparece perto de outro jogador, diante da câmera dele, mantendo sua própria base e incubadoras. O botão **👥 Encontrar amigo**, disponível na tela e em Salas, pede ao servidor um encontro na mesma sala e aponta a câmera para o amigo. O convite inclui o código da sala e o jogador que convidou; a reconexão conserva a última posição quando a sessão ainda existe. O código da sala e a presença dos jogadores ficam visíveis na tela.

## Executar o projeto

Com Node.js 18 ou superior instalado, abra um terminal nesta pasta e execute:

```sh
npm install
npm start
```

Abra `http://localhost:3000`. `npm run dev -- --port 4173` permite escolher a porta local. Para atualizar uma hospedagem existente, envie o projeto completo, incluindo `multiplayer-client.js`, `multiplayer-network.cjs`, `multiplayer-world.cjs`, os arquivos de chocagem, `pet-collection.js` e a pasta `audio`.

## Chocar ovos e pular

1. Pegue um ovo e leve-o ao círculo de depósito da sua base.
2. Aguarde a incubação. Ao ficar pronto, ele permanece na incubadora e aparece o botão **Chocar ovo**.
3. Toque no botão: a casca se abre com o som enviado, o animal aparece completamente branco com o áudio de suspense e depois revela suas cores e seu nome.
4. Toque em **Continuar** para voltar ao jogo. O pet é salvo antes da animação para não se perder ao fechar ou recarregar.

No celular, use o joystick para andar e **Pular** para saltar. No computador, use WASD/setas, Espaço para pular e E para agir. O salto também funciona após terminar o atordoamento de uma colisão.

Admin e eventos de chocagem instantânea podem antecipar a incubação; várias revelações aparecem em sequência.

## Jogo normal — 01/11/2026

A música, os palhaços, as risadas, a decoração e o surgimento de ovos de Halloween foram removidos. A API antiga informa evento inativo e os antigos scripts e áudios retornam 410. O modo normal independe do relógio do aparelho.

Os animais já conquistados permanecem com os mesmos IDs, renda, tamanhos e mutações em `pet-collection.js`, com nomes e aparência sem fantasias. Ovos já salvos nas incubadoras continuam até a chocagem. Dinheiro, velocidade, melhorias e chaves de armazenamento são preservados. O service worker atualiza somente o cache de recursos do jogo.

## Verificação

`npm test` executa os testes de lógica, salvamento, salto e multiplayer. Os testes de rede iniciam o servidor e conectam dois clientes com o código real do jogo em um ambiente sem renderização: disputam o mesmo ovo, perdem uma confirmação de depósito, reconectam e verificam a ausência de duplicação. Também são verificados capacidade de 16 jogadores, bases diferentes, troca para sala cheia, isolamento entre salas, eventos para novos jogadores e pacotes inválidos. Para o teste visual, instale `playwright` (`npm install --no-save playwright` e `npx playwright install chromium`) e execute `npm run test:hatching`. Ele verifica celular na vertical e horizontal e computador, com capturas em `test-results/hatching`.

## HUD de progresso e chat da sala — 31/10/2026

O jogo mostra apenas dois contadores de progresso na interface: **dinheiro** (estado `S.$`) e **Velocidade/Speed** (estado `S.sp`), sem velocímetro de carro nem botões de compra. O painel `hud-chat.js` consulta o estado em memória e não modifica o formato dos saves locais (`rue3d_v1`), os pets, os ovos nem as melhorias.

O chat é um recurso do WebSocket `/ws`: cada jogador conectado envia `{type:"chat",text:"..."}`; o servidor valida, limita frequência, atribui nome e sala a partir da sessão e transmite apenas para os membros daquela sala. O histórico fica somente no navegador durante a sessão; as mensagens não entram nos saves. O painel funciona em celular e computador. Testes: `node --test tests/chat-hud.test.cjs` ou `npm test`.
