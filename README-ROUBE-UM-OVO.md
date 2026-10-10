# Roube um Ovo 3D – multiplayer por salas

Implantação isolada na branch `roube-um-ovo-3d-multiplayer`. A branch principal da NOVA IA permanece intacta.

Render: runtime Node, `npm install --omit=dev`, `npm start`, health endpoint `/health`. Configure `ADMIN_PASSWORD_HASH` como variável de ambiente privada, contendo o SHA-256 hexadecimal da senha do ADMIN. Sem a variável as salas funcionam, mas ações ADMIN remotas ficam bloqueadas.

O jogo ainda está em versão multiplayer inicial: movimento e eventos são transmitidos por sala. Ovos e inventários continuam locais.
