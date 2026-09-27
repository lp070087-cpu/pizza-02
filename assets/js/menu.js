/* =========================================================================
   LEGUSTE PIZZARIA — apresentação 02
   Dados do cardápio.

   REGRA DESTA APRESENTAÇÃO: nada de informação comercial inventada.
   Tudo abaixo veio dos materiais reais da casa:

   · Rua Geni Saraiva, 1430 — Cerâmica, Nova Iguaçu
   · Telefones (21) 99254-3326 e (21) 97117-6835
   · @legustenovaiguacu
   · "+40 sabores tradicionais" · "3 tipos de massa" · "pizzas doces"
   · "Rodízio da Cerâmica" · "O melhor rodízio da Cerâmica"
   · "A melhor pizzaria de Nova Iguaçu" (print do Google enviado pela casa)
   · Promoção Maracanã: pizza + pizza média R$ 86,90
   · Pizza Maracanã: R$ 59,99  ← VALOR OFICIAL, não alterar
   · iFood e 99Food
   · Entrega grátis para a região

   Os demais preços são de APRESENTAÇÃO (o dono ajusta no cardápio final).
   As descrições são as mesmas já aprovadas na apresentação 01 — nenhuma
   descrição nova foi escrita para esta versão.
   O rodízio NÃO tem preço nesta apresentação: o material não é conclusivo.
   ========================================================================= */

window.LEGUSTE02 = {

  /* Categorias do cardápio horizontal (filtro) */
  categorias: [
    { id: 'todas',    nome: 'Todas' },
    { id: 'salgadas',  nome: 'Salgadas' },
    { id: 'especiais', nome: 'Especiais' },
    { id: 'doces',     nome: 'Doces' },
    { id: 'bebidas',   nome: 'Bebidas' }
  ],

  /* ---------------------------------------------------------------------
     SABORES — cada um com a FOTO REAL correspondente ao nome.
     `fundo` alterna a cor da metade superior do slide (identidade Leguste).
     --------------------------------------------------------------------- */
  sabores: [
    {
      id: 'p-pepperoni', nome: 'Pepperoni', cat: 'salgadas',
      desc: 'Fatias de pepperoni sobre mussarela derretida, com borda dourada e pimenta calabresa.',
      preco: 62.90, img: 'assets/img/pz-pepperoni', recMax: 900, arq: { w: 694, h: 373 }, tags: ['Mais pedida'],
      fundo: 'vermelho', massa: true
    },
    {
      id: 'p-frango-catupiry', nome: 'Frango com Catupiry', cat: 'salgadas',
      desc: 'Frango desfiado temperado, catupiry por cima e um toque de orégano.',
      preco: 63.90, img: 'assets/img/pz-frango-catupiry', recMax: 900, arq: { w: 708, h: 570 }, tags: ['Campeã da casa'],
      fundo: 'verde', massa: true
    },
    {
      id: 'p-presunto-catupiry', nome: 'Presunto com Catupiry', cat: 'salgadas',
      desc: 'Presunto, catupiry cremoso e azeitona preta sobre a mussarela.',
      preco: 60.90, img: 'assets/img/pz-presunto', recMax: 900, arq: { w: 662, h: 474 }, tags: [],
      fundo: 'dourado', massa: true
    },
    {
      id: 'p-frango-milho', nome: 'Frango com Milho', cat: 'salgadas',
      desc: 'Frango desfiado, milho verde e mussarela — leve e cremosa.',
      preco: 62.90, img: 'assets/img/pz-frango-milho', recMax: 900, arq: { w: 628, h: 499 }, tags: [],
      fundo: 'verde', massa: true
    },
    {
      id: 'p-quatro-queijos', nome: 'Quatro Queijos', cat: 'salgadas',
      desc: 'Mussarela, parmesão, provolone e catupiry na medida para o queijo esticar bem alto.',
      preco: 68.90, img: 'assets/img/pz-quatro-queijos', recMax: 900, arq: { w: 706, h: 338 }, tags: ['Queijo'],
      fundo: 'carvao', massa: true
    },
    {
      id: 'p-rucula', nome: 'Rúcula com Tomate Seco', cat: 'salgadas',
      desc: 'Mussarela coberta com rúcula fresca e tomate — finalização da casa.',
      preco: 66.90, img: 'assets/img/pz-rucula', recMax: 900, arq: { w: 694, h: 457 }, tags: [],
      fundo: 'verde', massa: true
    },

    {
      id: 'p-maracana', nome: 'Maracanã', cat: 'especiais',
      desc: 'A pizza grande que dá nome à promoção da casa: pepperoni generoso e massa no ponto.',
      preco: 59.99, img: 'assets/img/pz-maracana', recMax: 900, arq: { w: 727, h: 444 }, tags: ['R$ 59,99'],
      fundo: 'vermelho', massa: true, oficial: true
    },
    {
      id: 'p-pepperoni-catupiry', nome: 'Pepperoni com Bordas Fofas', cat: 'especiais',
      desc: 'Pepperoni na borda alta, massa macia por dentro e crocante por fora.',
      preco: 67.90, img: 'assets/img/pz-borda-fofa', recMax: 900, arq: { w: 694, h: 374 }, tags: [],
      fundo: 'vermelho', massa: true
    },
    {
      id: 'p-combo-duplo', nome: 'Dupla Leguste', cat: 'especiais',
      desc: 'Duas pizzas em uma só pedida — combinação perfeita para dividir a mesa.',
      preco: 96.90, img: 'assets/img/cb-dupla', recMax: 900, arq: { w: 900, h: 600 }, tags: ['Para dividir'],
      fundo: 'dourado', massa: true
    },
    {
      id: 'p-combo-familia', nome: 'Trio da Família', cat: 'especiais',
      desc: 'Três pizzas salgadas para a mesa cheia. Ideal para grupos e aniversários.',
      preco: 138.90, img: 'assets/img/cb-familia', recMax: 900, arq: { w: 900, h: 600 }, tags: ['Família'],
      fundo: 'verde', massa: true
    },

    {
      id: 'p-doce-rodizio', nome: 'Pizzas Doces do Rodízio', cat: 'doces',
      desc: 'Banana nevada, chocolate com granulado e prestígio entram no rodízio. Exceto banana nevada em algumas promoções.',
      preco: 44.90, img: 'assets/img/cb-doce', recMax: 900, arq: { w: 900, h: 391 }, tags: ['Inclusa no rodízio'],
      fundo: 'carvao', massa: false
    },

    { id: 'b-guarana-350', nome: 'Guaraná Antarctica Lata', cat: 'bebidas',
      desc: '350 ml, bem gelada.', preco: 7.50, img: 'assets/img/bb-guarana-lata', recMax: 300, arq: { w: 300, h: 587 },
      tags: [], fundo: 'verde', massa: false, bebida: true },
    { id: 'b-guarana-1l',  nome: 'Guaraná Antarctica 1 L', cat: 'bebidas',
      desc: 'Garrafa de 1 litro para dividir a mesa.', preco: 12.90, img: 'assets/img/bb-guarana-1l', recMax: 300, arq: { w: 300, h: 1047 },
      tags: [], fundo: 'verde', massa: false, bebida: true },
    { id: 'b-coca-350',    nome: 'Coca-Cola Lata', cat: 'bebidas',
      desc: '350 ml, sabor original.', preco: 8.00, img: 'assets/img/bb-coca-lata', recMax: 900, arq: { w: 478, h: 900 },
      tags: [], fundo: 'vermelho', massa: false, bebida: true },
    { id: 'b-coca-1l',     nome: 'Coca-Cola 1 L', cat: 'bebidas',
      desc: 'Garrafa de 1 litro.', preco: 13.50, img: 'assets/img/bb-coca-1l', recMax: 300, arq: { w: 300, h: 1032 },
      tags: [], fundo: 'vermelho', massa: false, bebida: true },
    { id: 'b-pepsi-lata',  nome: 'Pepsi Lata', cat: 'bebidas',
      desc: '350 ml, bem gelada.', preco: 7.50, img: 'assets/img/bb-pepsi-lata', recMax: 300, arq: { w: 300, h: 546 },
      tags: [], fundo: 'carvao', massa: false, bebida: true },
    { id: 'b-pepsi-1l',    nome: 'Pepsi 1 L', cat: 'bebidas',
      desc: 'Garrafa PET de 1 litro.', preco: 12.50, img: 'assets/img/bb-pepsi-1l', recMax: 300, arq: { w: 300, h: 829 },
      tags: [], fundo: 'carvao', massa: false, bebida: true }
  ],

  /* 3 tipos de massa — informado no material oficial da casa */
  massas: [
    { id: 'tradicional', nome: 'Tradicional',       desc: 'Massa fina e crocante', extra: 0 },
    { id: 'grossa',      nome: 'Grossa',            desc: 'Borda alta e macia',    extra: 6 },
    { id: 'catupiry',    nome: 'Borda de Catupiry', desc: 'Borda recheada',        extra: 12 }
  ],

  /* Fatos da casa — todos verificáveis no material enviado */
  fatos: [
    { numero: '+40', rotulo: 'sabores tradicionais' },
    { numero: '3',   rotulo: 'tipos de massa' },
    { numero: '2',   rotulo: 'pizzas doces no rodízio' }
  ],

  rodizio: {
    titulo: 'O melhor rodízio da Cerâmica',
    itens: [
      'Pizzas salgadas e doces à vontade',
      'Mais de 40 sabores tradicionais',
      '3 tipos de massa',
      'Ambiente climatizado',
      'Mesas para toda a família',
      'Aniversários na casa'
    ],
    /* sem preço: o material não é conclusivo sobre o valor atual */
    observacao: 'Valores e disponibilidade do rodízio: consulte a casa pelo WhatsApp.'
  },

  entrega: {
    gratisNaRegiao: true,
    tempo: '45–70 min',
    tempoOficial: false,
    apps: ['iFood', '99Food']
  },

  contato: {
    endereco: 'Rua Geni Saraiva, 1430',
    bairro: 'Cerâmica — Nova Iguaçu/RJ',
    tel1: '(21) 99254-3326',
    tel2: '(21) 97117-6835',
    zap: '5521992543326',
    insta: '@legustenovaiguacu',
    instaUrl: 'https://www.instagram.com/legustenovaiguacu/',
    googleBusca: 'https://www.google.com/search?q=Leguste+Pizzaria+Nova+Igua%C3%A7u'
  }
};
