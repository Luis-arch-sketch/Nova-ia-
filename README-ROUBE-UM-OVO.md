# Roube um Ovo 3D – multiplayer por salas

Implantação isolada na branch `roube-um-ovo-3d-multiplayer`. A branch principal da NOVA IA permanece intacta.

Render: runtime Node, `npm install --omit=dev`, `npm start`, health endpoint `/health`. Configure `ADMIN_PASSWORD_HASH` como variável de ambiente privada, contendo o SHA-256 hexadecimal da senha do ADMIN. Sem a variável as salas funcionam, mas ações ADMIN remotas ficam bloqueadas.

O servidor controla os ovos compartilhados, coleta, devolução, depósito e cronômetros de cada sala. Dois jogadores não conseguem coletar o mesmo ovo. O ovo carregado aparece para os outros jogadores, assim como o estado das incubadoras da base. O presente individual de boas-vindas de Halloween, pets, dinheiro e melhorias continuam no progresso local de cada jogador.

Conexões interrompidas tentam reconectar automaticamente, com limite entre as tentativas. A sessão recupera a base quando ela ainda está disponível, inclusive com o armazenamento bloqueado durante a mesma visita. Ovos carregados voltam à última posição conhecida ao desconectar. Depósitos usam um identificador e uma confirmação recuperável: perder a resposta e repetir o pedido não duplica o ovo. Salas vazias conservam o mapa por dois minutos para permitir a reconexão; depois são removidas. Reiniciar o processo do servidor cria novas salas e mapas, preservando o progresso já salvo no aparelho.

A sala de destino é validada antes da troca; se estiver cheia, o jogador permanece na anterior. Novos jogadores recebem o evento ativo com seu horário de término, e a reconexão não transporta eventos nem ovos de outra sala. ADMIN remoto é verificado novamente a cada conexão. Dados inválidos são ignorados, conexões mortas são removidas e a transmissão de movimento é agrupada a cada 100 ms.

Ao entrar numa sala ocupada, o jogador aparece perto de outro jogador, diante da câmera dele, mantendo sua própria base e incubadoras. O botão **👥 Encontrar amigo**, disponível na tela e em Salas, pede ao servidor um encontro na mesma sala e aponta a câmera para o amigo. O convite inclui o código da sala e o jogador que convidou; a reconexão conserva a última posição quando a sessão ainda existe. O código da sala e a presença dos jogadores ficam visíveis na tela.

## Executar o projeto

Com Node.js 18 ou superior instalado, abra um terminal nesta pasta e execute:

```sh
npm install
npm start
```

Abra `http://localhost:3000`. `npm run dev -- --port 4173` permite escolher a porta local. Para atualizar uma hospedagem existente, envie o projeto completo, incluindo `multiplayer-client.js`, `multiplayer-network.cjs`, `multiplayer-world.cjs`, os arquivos de chocagem, `halloween-clowns.js` e a pasta `audio`.

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

A risada enviada em `risada-de-bruxa.mp3` está em `audio/witch-laugh.mp3`, com volume de 70%. Ela toca aleatoriamente pelo mapa, mesmo longe dos palhaços: a primeira ocorre entre 20 e 45 segundos depois da primeira interação; as próximas, entre 35 e 80 segundos após a anterior terminar. A risada não fica em loop.

Os dois sons novos pausam durante a revelação de um ovo e quando o jogo vai para segundo plano. A música dos palhaços retorna se você ainda estiver perto ao voltar. A música de Halloween fica mais baixa para destacar os sons novos. Palhaços e risadas não dependem da data de encerramento do evento de Halloween.

## Verificação

`npm test` executa os testes de lógica, salvamento, salto e multiplayer. Os testes de rede iniciam o servidor e conectam dois clientes com o código real do jogo em um ambiente sem renderização: disputam o mesmo ovo, perdem uma confirmação de depósito, reconectam e verificam a ausência de duplicação. Também são verificados capacidade de 16 jogadores, bases diferentes, troca para sala cheia, isolamento entre salas, eventos para novos jogadores e pacotes inválidos. Para o teste visual, instale `playwright` (`npm install --no-save playwright` e `npx playwright install chromium`) e execute `npm run test:hatching`. Ele verifica celular na vertical e horizontal e computador, com capturas em `test-results/hatching`.

`npm run test:clowns` verifica os palhaços em celular e computador, a repetição real da música, a distância, a risada independente e a pausa dos sons durante a chocagem. Capturas ficam em `test-results/clowns`.
