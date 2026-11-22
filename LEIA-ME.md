# Site Arena FL Brinquedos

## Como abrir
- **VS Code:** instale a extensão **Live Server**, clique com o botão direito em `index.html` e escolha **"Open with Live Server"**.
- Ou dê dois cliques no `index.html` (precisa de internet para carregar o 3D e as fontes).

## Estrutura
| Arquivo | O que tem |
|---|---|
| `index.html` | Estrutura da página (textos, seções, contato) |
| `css/style.css` | Cores, layout e versão para celular |
| `js/data.js` | **Brinquedos e preços (edite aqui)** |
| `js/models.js` | Modelos 3D de cada brinquedo |
| `js/main.js` | Interações: 3D, filtros, orçamento, WhatsApp |
| `img/` | Coloque aqui as fotos reais |

## Mudar um preço
Abra `js/data.js` e altere o `preco:` do brinquedo. Os cards, a tabela e o orçamento são atualizados sozinhos.

## Trocar o 3D por foto real
1. Coloque a foto em `img/` (ex.: `img/futebol-sabao.jpg`, de preferência no formato 4:3, horizontal).
2. Em `js/data.js`, preencha `foto: "img/futebol-sabao.jpg"` no brinquedo.
3. O card passa a mostrar a foto e, ao abrir os detalhes, ainda dá para ver o 3D no botão **"Ver em 3D"**.

## WhatsApp
O número fica em `js/data.js` (`WHATSAPP = "5534997401253"`) e nos links do `index.html`.
