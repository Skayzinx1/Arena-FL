/* =========================================================
   CATÁLOGO DE BRINQUEDOS
   Para mudar preços, nomes ou descrições, edite apenas este arquivo.
   - preco: valor em reais (número)
   - categoria: "inflavel" | "pula" | "classico"
   - modelo: nome do modelo 3D em js/models.js
   - foto (opcional): caminho de uma foto real, ex.: "img/futebol-sabao.jpg"
       Coloque a foto na pasta img/ e preencha o campo. Com foto, o card
       mostra a foto e o 3D continua disponível no botão "Ver em 3D".
       Deixe "" para usar só o 3D.
   ========================================================= */
const WHATSAPP = "5534997401253";

const TOYS = [
  {
    id: "futebol-sabao",
    nome: "Futebol de Sabão",
    preco: 700,
    categoria: "inflavel",
    modelo: "futebolSabao",
    foto: "",
    cor: "#22a94b",
    destaque: "Mais procurado",
    desc: "Campo inflável com espuma e muita diversão. Perfeito para crianças, jovens e adultos!",
    itens: ["Campo inflável com traves", "Espuma de sabão", "4 horas de duração", "Monitor incluso"]
  },
  {
    id: "toboga",
    nome: "Tobogã",
    preco: 500,
    categoria: "inflavel",
    modelo: "toboga",
    foto: "",
    cor: "#e8352b",
    desc: "Tobogã inflável gigante para descer com muita adrenalina e segurança.",
    itens: ["Rampa de escalada", "Descida gigante", "4 horas de duração", "Monitor incluso"]
  },
  {
    id: "guerra-cotonetes",
    nome: "Guerra de Cotonetes",
    preco: 400,
    categoria: "inflavel",
    modelo: "guerraCotonetes",
    foto: "",
    cor: "#1f5fd6",
    desc: "Arena inflável com pedestais e cotonetes gigantes. Quem fica de pé por mais tempo?",
    itens: ["Arena inflável", "2 cotonetes gigantes", "4 horas de duração", "Monitor incluso"]
  },
  {
    id: "castelo-escorregador",
    nome: "Castelo com Escorregador",
    preco: 400,
    categoria: "inflavel",
    modelo: "castelo",
    foto: "",
    cor: "#7b3fe4",
    desc: "Castelo inflável para pular à vontade, com escorregador lateral.",
    itens: ["Área de pulo com rede", "Escorregador", "4 horas de duração", "Monitor incluso"]
  },
  {
    id: "piscina-inflavel",
    nome: "Piscina de Bolinhas Inflável",
    preco: 400,
    categoria: "inflavel",
    modelo: "piscinaInflavel",
    foto: "",
    cor: "#ffc21a",
    desc: "Piscina inflável cheia de bolinhas coloridas, macia e segura para os pequenos.",
    itens: ["Paredes infláveis macias", "Muitas bolinhas coloridas", "4 horas de duração", "Monitor incluso"]
  },
  {
    id: "pula-medio",
    nome: "Pula-Pula Médio",
    preco: 150,
    categoria: "pula",
    modelo: "pulaMedio",
    foto: "",
    cor: "#1f5fd6",
    desc: "Clássico das festas! Pula-pula com rede de proteção em toda a volta.",
    itens: ["Rede de proteção", "Proteção nas molas", "Tamanho médio"]
  },
  {
    id: "pula-pequeno",
    nome: "Pula-Pula Pequeno",
    preco: 120,
    categoria: "pula",
    modelo: "pulaPequeno",
    foto: "",
    cor: "#e8352b",
    desc: "Ideal para os pequenos e para espaços menores.",
    itens: ["Rede de proteção", "Proteção nas molas", "Ocupa pouco espaço"]
  },
  {
    id: "piscina-bolinhas",
    nome: "Piscina de Bolinhas",
    preco: 150,
    categoria: "classico",
    modelo: "piscinaBolinhas",
    foto: "",
    cor: "#22a94b",
    desc: "Piscina de bolinhas com cobertura colorida, ideal para crianças pequenas.",
    itens: ["Cobertura colorida", "Bolinhas coloridas", "Ótima para os pequenos"]
  },
  {
    id: "pebolim",
    nome: "Pebolim",
    preco: 150,
    categoria: "classico",
    modelo: "pebolim",
    foto: "",
    cor: "#b07a45",
    desc: "O famoso totó! Diversão garantida para todas as idades.",
    itens: ["Mesa completa", "Para crianças e adultos", "Até 4 jogadores"]
  }
];

const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
