# Mr. Bean: Mini Rush 🚗

Jogo 2D de corrida infinita feito com HTML, CSS e JavaScript. Projeto de fã não oficial.

## Jogar localmente

Extraia o ZIP e abra `index.html` em um navegador moderno. Se alguma imagem não carregar ao abrir com `file://`, use um servidor local (`python -m http.server 8000`) e visite `http://localhost:8000`.

## Controles

- `ESPAÇO` / `↑` / `W` / botão **PULAR**: pular sobre carros.
- `X` / botão **TURBO**: turbo após comprar o upgrade.
- `P` / `Esc`: pausa/retoma.
- `M`: silencia/ativa o som.
- Celular: botões grandes PULAR e TURBO; tocar no cenário também pula.

## Recursos já implementados

- Animação do Mr. Bean entrando no Mini verde.
- 13 cenários de Londres repetidos em loop infinito.
- Carros rivais com diversas silhuetas e colisão; pulo com física e escudo opcional.
- Partículas de explosão, fumaça, tremor de câmera e tela de game over.
- Motor, pulo, pneus, explosão, moeda, diamante e turbo via Web Audio API (sem MP3 externo).
- Moedas a cada 5 segundos, diamantes a cada 40 segundos, moedas por desvios e itens coletáveis.
- 11 missões com progresso cumulativo e resgate de recompensa.
- 5 melhorias compráveis com moeda do jogo: motor, suspensão, ímã, escudo e turbo.
- Recordes, pausa automática quando sair da aba, salvamento local via `localStorage`.
- Interface responsiva e botões de toque.

## Publicação no Render

Criar **Static Site** com um repositório GitHub contendo estes arquivos.

- Build Command: `echo "Static game ready"`
- Publish directory: `.`
- Branch: `main`

O jogo não precisa de Node.js, banco de dados, backend ou variáveis de ambiente.

## Observações

- Moedas e diamantes são fictícios, não há compras com dinheiro real.
- O progresso é local do navegador e não é sincronizado entre aparelhos.
- O Mini e os veículos rivais são desenhados em Canvas; a imagem do Mr. Bean foi fornecida pelo usuário.
- Os outros oito personagens permanecem na pasta `assets/sprites` para missões/histórias futuras.
- Os cenários são imagens estáticas feitas anteriormente, e as transições podem ter pequenas descontinuidades visuais.

### Versão para publicação no Render
As 13 imagens de fundo e os nove personagens são embutidos em módulos `art-*.js`, para que a publicação tenha todos os recursos mesmo sem arquivos binários no GitHub. O jogo é 100% estático.