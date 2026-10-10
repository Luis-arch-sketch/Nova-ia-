# Roube um Ovo 3D — gráficos e QA

## Ambiente / cuidados
- Branch do jogo: `roube-um-ovo-3d-multiplayer` do repositório `Luis-arch-sketch/Nova-ia-`.
- Serviço Render: `srv-db5a4qflot8c73e84020`, workspace `tea-daicep7qj5pc739hdqbg`.
- URL: https://roube-um-ovo-3d-salas.onrender.com/
- Botões e posições originais devem continuar iguais (Admin, Placar, Salas, Loja, Tela cheia, Pular, Ação e Destravar).
- Chaves de persistência: `rue3d_v1`, `rue3d_admin_v2` e `rue3d_limited_world_v1`. **Nunca apagar ou renomear estas chaves.**
- Dinheiro, ovos e Speed são salvos no mesmo navegador Android, não em nuvem.
- Admin Abuse, corrida 10×, esteira ADMIN 100Qav/s, LIMITEDs repetidos e salas públicas sob demanda são funcionalidades existentes a preservar.
- `main` é outro projeto: usar apenas o branch multiplayer.

## Arquitetura visual
- `index.html` contém a lógica do jogo.
- `animals3d.js` contém os modelos 3D procedurais, padrões de ovos, cenário, biomas, vegetação, monumentos, clima e avatar detalhado.
- `server.js` injeta as melhorias no HTML servido, além do código da esteira ADMIN e salas. O arquivo `index.html` continua sem alterações de layout.
- O servidor embute `animals3d.js` diretamente no HTML: o site dispensa uma segunda requisição para os modelos.
- 13 biomas × 8 espécies + LIMITED = 105 índices de criaturas. Os guardiões também usam modelos detalhados.
- A geometria e muitos materiais são compartilhados. Árvores, monumentos e decoração usam InstancedMesh para reduzir chamadas GPU.
- Partículas de neve, cinzas, pétalas e magia usam um único Points por cena e cores específicas por bioma.
- O céu e a névoa mudam gradualmente por bioma, preservando noite e efeitos especiais.
- Visibilidade de ovos, guardiões e pets distantes é limitada **somente na renderização**; a economia, a colisão, o inventário e os saves continuam ativos.

## Testes reprodutíveis
- `.github/workflows/visual-audit.yml` roda no GitHub Actions.
- `tests/visual-audit.mjs` inicia o servidor, abre Chromium com WebGL2 simulando Android 393×852 e desktop 1280×720.
- Valida renderização 3D, espécies, guardiões, biomas, botões inalterados, movimento real do joystick por eventos touch, save/reload de 3 LIMITEDs, conservação do Speed e o botão Destravar.
- Gera screenshots `android.png`, `desktop.png`, `animal-gallery.png`, `boss-gallery.png` e de Deserto, Vulcão, Cósmico e Floresta Encantada.
- Em uma auditoria anterior, as chamadas GPU medidas no Android caíram de 676 para 400 (mais tarde 433 após a atualização do avatar); são resultados de testes Chromium, não garantia de FPS em todos os celulares.
- **Política de publicação:** nunca afirmar que uma mudança está LIVE antes de `get_deploy` confirmar status `live` no commit correto. O Render precisa de trigger manual após commits e a URL /health deve retornar `{ok:true}`.

## Próximos avanços sugeridos
1. Fotografar e corrigir individualmente os bosses cujas silhuetas permaneçam parecidas.
2. Melhorar em lotes as espécies do INDEX, priorizando características anatômicas identificáveis.
3. Testar 100–500 LIMITEDs com WebGL2 e, se necessário, implementar visualização com instâncias para grupos distantes.
4. Rever o rendimento em celulares Android com memória baixa e reduzir draw calls sem diminuir drasticamente os detalhes próximos.
5. Manter a interface atual intacta e sempre executar o GitHub Actions antes de publicar.

> A remodelagem é estilizada/procedural, ainda não substitui modelos artísticos feitos sob medida de cada criatura. Este arquivo registra exatamente o que foi implementado e o que falta melhorar.
