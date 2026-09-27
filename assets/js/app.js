/* =========================================================================
   LEGUSTE PIZZARIA — apresentação 02
   Comportamento: cardápio horizontal, modal do produto, carrinho e WhatsApp.

   Sem backend e sem pagamento: o pedido é montado na tela e enviado para a
   Leguste pelo WhatsApp (o mesmo número que a casa já usa).
   ========================================================================= */
(function () {
  'use strict';

  var D = window.LEGUSTE02 || {};
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------------- util */
  function brl(n) {
    var v = (Math.round(n * 100) / 100).toFixed(2).split('.');
    var int = v[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return { inteiro: int, cent: v[1] };
  }
  function precoHTML(n) {
    var p = brl(n);
    return 'R$ ' + p.inteiro + '<span class="cent">,' + p.cent + '</span>';
  }
  function precoTxt(n) { var p = brl(n); return 'R$ ' + p.inteiro + ',' + p.cent; }

  function avisar(msg) {
    var el = $('#aviso');
    if (!el) return;
    el.textContent = '';
    /* reanuncia mesmo com mensagem repetida */
    window.setTimeout(function () { el.textContent = msg; }, 30);
  }

  var movReduzido = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

  /* A preferencia pode mudar com a pagina aberta: quem liga "menos movimento"
     depois de abrir tem de ver a variedade SUMIR na hora, e quem desliga tem
     de ve-la voltar. Sem este aviso, a troca ficaria congelada no estado em
     que a pagina abriu.                                                     */
  if (movReduzido && movReduzido.addEventListener) {
    movReduzido.addEventListener('change', function () {
      /* a marca existe SO quando ha reducao: ligou, marca e tira a variedade;
         desligou, a marca sai e a variedade volta.                        */
      if (movReduzido.matches) {
        document.documentElement.setAttribute('data-movimento-reduzido', 'sim');
      } else {
        document.documentElement.removeAttribute('data-movimento-reduzido');
      }
      pintarTroca();
    });
  }

  /* ================================ ESTADO ================================ */
  var estado = {
    filtro: 'todas',
    lista: [],          /* sabores visíveis no trilho */
    indice: 0,
    carrinho: [],
    /* produto em edição no modal */
    editando: null
  };

  function acharSabor(id) {
    for (var i = 0; i < D.sabores.length; i++) if (D.sabores[i].id === id) return D.sabores[i];
    return null;
  }
  function calcularLista() {
    estado.lista = D.sabores.filter(function (s) {
      return estado.filtro === 'todas' || s.cat === estado.filtro;
    });
  }

  /* ============================== 1. FATOS ============================== */
  function montarFatos() {
    var alvo = $('#hero-fatos');
    if (!alvo || !D.fatos) return;
    alvo.innerHTML = D.fatos.map(function (f) {
      return '<li><b>' + f.numero + '</b><span>' + f.rotulo + '</span></li>';
    }).join('');
  }

  /* ============================= 2. FILTROS ============================= */
  function montarFiltros() {
    var alvo = $('#filtros');
    if (!alvo) return;
    alvo.innerHTML = D.categorias.map(function (c) {
      var ativo = c.id === estado.filtro ? 'true' : 'false';
      return '<button class="filtro" type="button" data-filtro="' + c.id +
             '" aria-pressed="' + ativo + '">' + c.nome + '</button>';
    }).join('');

    alvo.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-filtro]');
      if (!b) return;
      estado.filtro = b.getAttribute('data-filtro');
      $$('.filtro', alvo).forEach(function (x) {
        x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
      });
      montarTrilho();
      irPara(0, false);
      avisar(D.categorias.filter(function (c) { return c.id === estado.filtro; })[0].nome + ': ' + estado.lista.length + ' itens');
    });
  }

  /* ---------------------------------------------------------------- fotos
     Toda foto de produto e um RECORTE (`...-cut-*.webp`): o produto nao tem
     fundo nenhum e aparece direto sobre a pagina.

     NEM TODO PRODUTO TEM OS TRES TAMANHOS. As cinco bebidas de 1 L e as latas
     menores so foram recortadas em 300px — nao existe `-520` nem `-900` para
     elas. O codigo anunciava `520w` e `900w` de qualquer jeito, o navegador
     escolhia um arquivo que nao existe, e o `onerror` NAO resolvia: ele trocava
     o `src` mas deixava o `srcset` apontando para o arquivo quebrado, entao o
     navegador reescolhia o mesmo 404 e o `error` voltava a disparar em ciclo.
     Era essa a origem do texto alternativo no lugar da lata do Guarana.

     Agora o teto de cada produto e declarado em `menu.js` (`recMax`) e o
     `srcset` so anuncia o que existe no disco.                                */
  var ESCADA = [900, 520, 300];

  function recorte(s, sufixo) { return s.img + '-cut-' + sufixo + '.webp'; }

  function tamanhos(s) {
    var teto = s.recMax || 900;
    var lista = ESCADA.filter(function (n) { return n <= teto; });
    return lista.length ? lista : [ESCADA[ESCADA.length - 1]];
  }

  function guardar(escopo) {
    $$('img[data-cadeia]', escopo || document).forEach(function (img) {
      if (img.__guardado) return;
      img.__guardado = true;
      img.addEventListener('error', function () {
        var cadeia = (img.getAttribute('data-cadeia') || '').split('|').filter(Boolean);
        var proximo = cadeia.shift();
        if (!proximo) { return; }                 /* acabou a cadeia: para */
        img.setAttribute('data-cadeia', cadeia.join('|'));
        /* `srcset` VENCE `src`. Sem limpar os dois, o navegador reescolhe o
           mesmo arquivo quebrado e o erro nunca sai da fila.                 */
        img.removeAttribute('srcset');
        img.removeAttribute('sizes');
        img.src = proximo;
      });
    });
  }

  function slideHTML(s) {
    var tags = (s.tags || []).map(function (t) {
      return '<span class="slide__tag">' + t + '</span>';
    }).join('');

    var tam = tamanhos(s);
    var maior = tam[0];
    var resto = tam.slice(1);
    /* o `srcset` so lista os tamanhos que EXISTEM; o maior deles vira o `src` */
    var srcset = resto.map(function (n) {
      return recorte(s, n) + ' ' + n + 'w';
    }).join(', ');

    /* `arq` e o tamanho REAL do arquivo (lido do proprio webp, nao estimado).
       Sem ele a caixa reservava uma proporcao inventada e a lata, que e alta e
       estreita, era esticada para a forma de pizza.                          */
    var arq = s.arq || { w: maior, h: Math.round(maior / 0.72) };
    var dims = ' width="' + arq.w + '" height="' + arq.h + '"';

    return '' +
      '<article class="slide' + (s.bebida ? ' slide--bebida' : '') + '" data-id="' + s.id + '">' +
        '<div class="slide__arte">' +
          '<img class="slide__foto" src="' + recorte(s, maior) + '"' +
            (srcset ? ' srcset="' + srcset + '"' : '') +
            ' sizes="(min-width:1000px) 46vw, 94vw"' +
            (resto.length ? ' data-cadeia="' + resto.map(function (n) { return recorte(s, n); }).join('|') + '"' : '') +
            ' alt="' + s.nome + ' da Leguste Pizzaria"' +
            dims +
            ' loading="lazy" decoding="async">' +
          '<h3 class="slide__nome">' + s.nome + '</h3>' +
        '</div>' +
        '<div class="slide__info">' +
          (tags ? '<div class="slide__tags">' + tags + '</div>' : '') +
          '<p class="slide__preco"><i>a partir de</i> ' + precoHTML(s.preco) + '</p>' +
          '<p class="slide__rotulo">' + (s.bebida ? 'Como é servida' : 'Ingredientes') + '</p>' +
          '<p class="slide__desc">' + s.desc + '</p>' +
          '<div class="slide__acoes">' +
            '<button class="btn btn--vermelho" type="button" data-escolher="' + s.id + '">Escolher</button>' +
            '<button class="btn btn--contorno" type="button" data-direto="' + s.id + '">Adicionar</button>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function montarTrilho() {
    var trilho = $('#trilho');
    if (!trilho) return;
    calcularLista();

    if (!estado.lista.length) {
      trilho.innerHTML = '<p class="texto" style="padding:2rem 4vw">Nada nesta categoria.</p>';
      atualizarPontos();
      return;
    }
    trilho.innerHTML = estado.lista.map(slideHTML).join('');
    guardar(trilho);
    atualizarPontos();
    /* a primeira imagem do trilho já entra quente */
    var p = $('.slide__foto', trilho);
    if (p) { p.loading = 'eager'; p.fetchPriority = 'low'; }
  }

  function atualizarPontos() {
    var alvo = $('#pontos');
    if (!alvo) return;
    alvo.innerHTML = estado.lista.map(function (_, i) {
      return '<span class="ponto' + (i === estado.indice ? ' esta-ativo' : '') + '"></span>';
    }).join('');
    var s = $('.seta[data-dir="-1"]'), n = $('.seta[data-dir="1"]');
    if (s) s.disabled = estado.indice <= 0;
    if (n) n.disabled = estado.indice >= estado.lista.length - 1;
  }

  /* ---------------------------------------------------------------------
     GEOMETRIA DO CARROSSEL (o produto fica CENTRADO, com o vizinho espiando)
     ---------------------------------------------------------------
     Cada slide ocupa a largura inteira do trilho; o trilho tem um espaco
     interno `--centro-pad` de cada lado e o mesmo valor em `scroll-padding`.
     Assim o "porto de encaixe" tem exatamente a largura de um produto e o
     encaixe centraliza — e o vao e por onde o vizinho aparece.
     A conta abaixo NAO repete esses numeros: ela os le do CSS, para nao
     divergirem quando uma media query muda o valor.                          */
  function medidas() {
    var trilho = $('#trilho');
    if (!trilho || !trilho.children.length) return null;
    var cs = window.getComputedStyle(trilho);
    var pad = parseFloat(cs.paddingLeft) || 0;
    var g = parseFloat(cs.columnGap || cs.gap) || 0;
    var visor = trilho.clientWidth || 1;
    var w = trilho.children[0].offsetWidth || 1;
    return {
      trilho: trilho, pad: pad, passo: w + g, visor: visor, largura: w,
      /* quanto o slide precisa andar para ficar centrado, alem do proprio
         avanco de um passo por produto */
      folga: pad - (visor - w) / 2
    };
  }

  function irPara(i, suave) {
    var m = medidas();
    if (!m || !estado.lista.length) return;
    i = Math.max(0, Math.min(estado.lista.length - 1, i));
    estado.indice = i;
    var comportamento = (suave && !(movReduzido && movReduzido.matches)) ? 'smooth' : 'auto';
    m.trilho.scrollTo({ left: i * m.passo + m.folga, behavior: comportamento });
    pintarTroca();
    atualizarPontos();
  }

  /* ---------------------------------------------------------------------
     A TROCA DE SABOR.
     A partir de quanto cada produto esta longe do centro saem duas medidas,
     escritas no proprio slide e usadas pelo CSS:
       --d  distancia com sinal (-1 antes do centro, +1 depois)
       --p  proximidade (1 no centro, 0 a uma tela de distancia)
     Com isso a pizza que sai desliza e gira de leve, a que entra chega do
     lado, e o texto acompanha. E so `transform` e `opacity`: nada que
     recalcule layout, nada que brigue com o encaixe.
     Quem pediu menos movimento nao recebe nada disto.                     */
  function pintarTroca() {
    var m = medidas();
    if (!m) return;
    var slides = m.trilho.children;
    if (movReduzido && movReduzido.matches) {
      for (var k = 0; k < slides.length; k++) limparTroca(slides[k]);
      return;
    }
    var centro = m.trilho.scrollLeft + m.visor / 2;
    for (var i = 0; i < slides.length; i++) {
      var s = slides[i];
      var d = (s.offsetLeft + m.largura / 2 - centro) / m.largura;
      /* longe demais nao aparece: nao vale gastar estilo com ele */
      if (d > 1.4 || d < -1.4) { limparTroca(s); continue; }
      d = Math.round(d * 1000) / 1000;
      if (s.__d === d) continue;
      s.__d = d;
      s.style.setProperty('--d', String(d));
      s.style.setProperty('--p', String(Math.max(0, 1 - Math.abs(d))));
    }
  }
  function limparTroca(s) {
    /* `undefined` e "nunca pintado". O produto que esta no centro tem
       distancia 0, e 0 e um valor legitimo — usar o proprio numero como
       marca deixaria esse slide sujo para sempre. */
    if (s.__d === undefined) return;
    s.__d = undefined;
    s.style.removeProperty('--d');
    s.style.removeProperty('--p');
  }

  function ligarTrilho() {
    var trilho = $('#trilho');
    if (!trilho) return;

    /* setas */
    $$('.seta').forEach(function (b) {
      b.addEventListener('click', function () {
        irPara(estado.indice + Number(b.getAttribute('data-dir')), true);
      });
    });

    /* teclado */
    trilho.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowRight') { ev.preventDefault(); irPara(estado.indice + 1, true); }
      else if (ev.key === 'ArrowLeft') { ev.preventDefault(); irPara(estado.indice - 1, true); }
      else if (ev.key === 'Home') { ev.preventDefault(); irPara(0, true); }
      else if (ev.key === 'End') { ev.preventDefault(); irPara(estado.lista.length - 1, true); }
    });

    /* acompanha o dedo / trackpad / arraste e sincroniza o indicador */
    var agendado = false;
    function aoRolar() {
      if (agendado) return;
      agendado = true;
      window.requestAnimationFrame(function () {
        agendado = false;
        var m = medidas();
        if (!m) return;
        /* a troca acompanha o dedo/roda a cada quadro, nao so ao assentar */
        pintarTroca();
        var i = Math.round((trilho.scrollLeft - m.folga) / m.passo);
        if (i !== estado.indice && i >= 0 && i < estado.lista.length) {
          estado.indice = i;
          atualizarPontos();
          esconderDica();
        }
      });
    }
    trilho.addEventListener('scroll', aoRolar, { passive: true });

    /* arrastar com o mouse no desktop (o dedo já funciona nativo no celular) */
    ligarArraste(trilho);

    /* roda do mouse: rolagem normal da página continua sendo do <main>.
       A roda só troca de sabor com Shift, ou quando o trilho está no fim. */
    trilho.addEventListener('wheel', function (ev) {
      var eixoX = Math.abs(ev.deltaX) > Math.abs(ev.deltaY);
      if (!eixoX && !ev.shiftKey) return;   /* vertical: deixa a página rolar */
      ev.preventDefault();
      irPara(estado.indice + ((ev.deltaX || ev.deltaY) > 0 ? 1 : -1), true);
    }, { passive: false });
  }

  function ligarArraste(trilho) {
    var ativo = false, x0 = 0, l0 = 0, moveu = false, ponteiro = null;

    trilho.addEventListener('pointerdown', function (ev) {
      if (ev.pointerType === 'touch') return;   /* touch usa o nativo */
      if (ev.button !== 0) return;
      if (ev.target.closest('button, a')) return;
      ativo = true; moveu = false; ponteiro = ev.pointerId;
      x0 = ev.clientX; l0 = trilho.scrollLeft;
      trilho.style.scrollBehavior = 'auto';
      trilho.style.cursor = 'grabbing';
    });

    trilho.addEventListener('pointermove', function (ev) {
      if (!ativo) return;
      var d = ev.clientX - x0;
      if (Math.abs(d) > 4) moveu = true;
      trilho.scrollLeft = l0 - d;
      if (moveu && ev.cancelable) ev.preventDefault();
    });

    function soltar() {
      if (!ativo) return;
      ativo = false;
      trilho.style.cursor = '';
      trilho.style.scrollBehavior = '';
      ponteiro = null;
      if (moveu) irPara(estado.indice, true);
    }
    trilho.addEventListener('pointerup', soltar);
    trilho.addEventListener('pointercancel', soltar);
    trilho.addEventListener('pointerleave', soltar);
    /* evita seleção de texto durante o arraste */
    trilho.addEventListener('dragstart', function (e) { e.preventDefault(); });
  }

  var dicaEscondida = false;
  function esconderDica() {
    if (dicaEscondida) return;
    dicaEscondida = true;
    var d = $('#arraste');
    if (d) d.classList.add('esta-oculto');
  }

  function recolherImagens() {
    /* economiza memória: só o slide atual e os vizinhos ficam prontos */
    var trilho = $('#trilho');
    if (!trilho) return;
    $$('.slide', trilho).forEach(function (s, i) {
      var img = $('.slide__foto', s);
      if (!img) return;
      img.loading = Math.abs(i - estado.indice) <= 1 ? 'eager' : 'lazy';
    });
  }

  /* ========================== 4. MODAL DO PRODUTO ========================== */
  var modal, modalEstado;

  function abrirModal(id) {
    var s = acharSabor(id);
    if (!s) return;

    modalEstado = { sabor: s, qtd: 1, massa: 'tradicional' };
    estado.editando = null;

    var mi = $('#modal-img');
    mi.src = recorte(s, 300);
    mi.setAttribute('data-cadeia', recorte(s, 520) + '|' + recorte(s, 900));
    guardar(mi.parentNode);
    $('#modal-img').alt = s.nome + ' da Leguste Pizzaria';
    $('#modal-nome').textContent = s.nome;
    $('#modal-preco').innerHTML = precoHTML(s.preco);
    $('#modal-desc').textContent = s.desc;
    $('#modal-obs').value = '';
    $('#modal-qtd').textContent = '1';

    /* massa só aparece para pizza; bebida não tem massa */
    var blocoMassa = $('#modal-bloco-massa');
    blocoMassa.hidden = !s.massa;

    montarMassas(s);
    atualizarTotalModal();

    modal.hidden = false;
    document.body.style.overflow = '';
    $('#modal-add').focus();
    avisar('Produto aberto: ' + s.nome);
  }

  function montarMassas(s) {
    $('#modal-massas').innerHTML = (D.massas || []).map(function (m) {
      var checado = m.id === 'tradicional' ? ' checked' : '';
      return '' +
        '<label class="tamanho">' +
          '<input type="radio" name="massa" value="' + m.id + '"' + checado + '>' +
          '<span class="tamanho__bolinha" aria-hidden="true"></span>' +
          '<span class="tamanho__txt"><b>' + m.nome + '</b><small>' + m.desc + '</small></span>' +
          '<span class="tamanho__extra">' + (m.extra ? '+ ' + precoTxt(m.extra) : 'incluso') + '</span>' +
        '</label>';
    }).join('');
  }

  function precoUnitario() {
    if (!modalEstado) return 0;
    var base = modalEstado.sabor.preco;
    if (!modalEstado.sabor.massa) return base;   /* bebida: sem massa */
    var m = (D.massas || []).filter(function (x) { return x.id === modalEstado.massa; })[0];
    return base + (m ? m.extra : 0);
  }

  function atualizarTotalModal() {
    var total = precoUnitario() * modalEstado.qtd;
    $('#modal-total').innerHTML = precoHTML(total);
    $('#modal-qtd').textContent = String(modalEstado.qtd);
  }

  function ligarModal() {
    modal = $('#modal');
    if (!modal) return;

    modal.addEventListener('click', function (ev) {
      if (ev.target.closest('[data-fechar-modal]')) fecharModal();
    });

    $$('[data-qtd]', modal).forEach(function (b) {
      b.addEventListener('click', function () {
        var d = Number(b.getAttribute('data-qtd'));
        modalEstado.qtd = Math.max(1, Math.min(20, modalEstado.qtd + d));
        atualizarTotalModal();
      });
    });

    $('#modal-massas').addEventListener('change', function (ev) {
      if (ev.target.name === 'massa') {
        modalEstado.massa = ev.target.value;
        atualizarTotalModal();
      }
    });

    $('#modal-add').addEventListener('click', function () {
      adicionar(modalEstado.sabor, modalEstado.qtd, modalEstado.massa, $('#modal-obs').value);
      fecharModal();
    });

    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape') return;
      if (!modal.hidden) { fecharModal(); return; }
      if ($('#carrinho').classList.contains('esta-aberto')) fecharCarrinho();
    });

    /* mantém o foco dentro do modal enquanto ele está aberto */
    modal.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Tab' || modal.hidden) return;
      var foco = $$('button, input, textarea, [href]', modal).filter(function (el) {
        return !el.disabled && el.offsetParent !== null;
      });
      if (!foco.length) return;
      var primeiro = foco[0], ultimo = foco[foco.length - 1];
      if (ev.shiftKey && document.activeElement === primeiro) { ev.preventDefault(); ultimo.focus(); }
      else if (!ev.shiftKey && document.activeElement === ultimo) { ev.preventDefault(); primeiro.focus(); }
    });
  }

  function fecharModal() {
    if (!modal) return;
    modal.hidden = true;
    modalEstado = null;
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }

  var ultimoFoco = null;

  /* ============================== 5. CARRINHO ============================== */
  function adicionar(sabor, qtd, massaId, obs) {
    var massa = null;
    if (sabor.massa) {
      massa = (D.massas || []).filter(function (m) { return m.id === massaId; })[0] || D.massas[0];
    }
    var unit = sabor.preco + (massa ? massa.extra : 0);
    var chave = sabor.id + '|' + (massa ? massa.id : '') + '|' + (obs || '').trim();

    var igual = null;
    for (var i = 0; i < estado.carrinho.length; i++) {
      if (estado.carrinho[i].chave === chave) { igual = estado.carrinho[i]; break; }
    }
    if (igual) igual.qtd = Math.min(20, igual.qtd + qtd);
    else estado.carrinho.push({
      chave: chave, id: sabor.id, nome: sabor.nome, img: sabor.img,
      massa: massa ? massa.nome : '', obs: (obs || '').trim(),
      unit: unit, qtd: qtd
    });

    desenharCarrinho();
    var b = $('#barra') && $('#barra').classList.contains('esta-visivel') ? 'barra' : 'topo';
    avisar(sabor.nome + ' adicionado ao pedido. Total: ' + precoTxt(subtotal()) + '. Alvo: ' + b);
    pulsarCarrinho();
  }

  function subtotal() {
    return estado.carrinho.reduce(function (t, it) { return t + it.unit * it.qtd; }, 0);
  }
  function totalItens() {
    return estado.carrinho.reduce(function (t, it) { return t + it.qtd; }, 0);
  }

  function desenharCarrinho() {
    var n = totalItens();
    var sub = subtotal();

    /* topo */
    var badge = $('#topo-qtd');
    if (badge) {
      badge.textContent = String(n);
      badge.setAttribute('data-vazio', n ? '0' : '1');
    }
    var bt = $('#topo-qtd-texto');
    if (bt) bt.textContent = n === 0 ? 'nenhum item' : (n + (n === 1 ? ' item' : ' itens'));

    /* barra do celular */
    var barra = $('#barra');
    if (barra) {
      barra.hidden = n === 0;
      barra.classList.toggle('esta-visivel', n > 0);
      $('#barra-qtd').textContent = String(n);
      $('#barra-sub').textContent = precoTxt(sub);
      document.body.classList.toggle('esta-com-barra', n > 0);
    }

    /* lista */
    var lista = $('#carrinho-lista');
    var vazio = $('#carrinho-vazio');
    if (vazio) vazio.hidden = n > 0;

    if (lista) {
      lista.innerHTML = estado.carrinho.map(function (it, i) {
        var opc = it.massa ? 'Massa ' + it.massa : '';
        return '' +
          '<li class="item" data-i="' + i + '">' +
            '<img class="item__foto" src="' + recorte(it, 300) + '" alt="" width="60" height="60" loading="lazy"' +
              ' data-cadeia="' + recorte(it, 520) + '|' + recorte(it, 900) + '">' +
            '<div class="item__txt">' +
              '<span class="item__nome">' + it.nome + '</span>' +
              (opc ? '<span class="item__opc">' + opc + '</span>' : '') +
              (it.obs ? '<span class="item__obs">“' + it.obs + '”</span>' : '') +
              '<span class="item__qtd">' +
                '<button type="button" data-item-qtd="-1" data-i="' + i + '" aria-label="Diminuir ' + it.nome + '">−</button>' +
                '<span>' + it.qtd + '</span>' +
                '<button type="button" data-item-qtd="1" data-i="' + i + '" aria-label="Aumentar ' + it.nome + '">+</button>' +
              '</span>' +
            '</div>' +
            '<div class="item__pe">' +
              '<strong class="item__preco">' + precoTxt(it.unit * it.qtd) + '</strong>' +
              '<button class="item__remover" type="button" data-item-remover="' + i + '">Remover</button>' +
            '</div>' +
          '</li>';
      }).join('');
      guardar(lista);
    }

    $('#carrinho-sub').textContent = precoTxt(sub);
    var nota = $('#carrinho-nota');
    if (nota) {
      if (D.entrega && D.entrega.gratisNaRegiao) {
        nota.textContent = 'Entrega grátis para a região. ' +
          (D.entrega.tempoOficial ? 'Tempo estimado: ' + D.entrega.tempo + '.'
                                  : 'O tempo de entrega é confirmado pela Leguste no WhatsApp.');
      } else { nota.textContent = ''; }
    }

    var fin = $('#carrinho-finalizar');
    if (fin) fin.disabled = n === 0;
  }

  function pulsarCarrinho() {
    var b = $('#topo') && $('.btn--pedido', $('#topo'));
    if (!b || (movReduzido && movReduzido.matches)) return;
    b.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.09)' }, { transform: 'scale(1)' }],
      { duration: 340, easing: 'cubic-bezier(.16,.84,.24,1)' }
    );
  }

  function ligarCarrinho() {
    $('.carrinho__corpo').addEventListener('click', function (ev) {
      var q = ev.target.closest('[data-item-qtd]');
      var r = ev.target.closest('[data-item-remover]');
      if (q) {
        var i = Number(q.getAttribute('data-i'));
        var d = Number(q.getAttribute('data-item-qtd'));
        estado.carrinho[i].qtd = Math.max(1, Math.min(20, estado.carrinho[i].qtd + d));
        desenharCarrinho();
      } else if (r) {
        var k = Number(r.getAttribute('data-item-remover'));
        var nome = estado.carrinho[k].nome;
        estado.carrinho.splice(k, 1);
        desenharCarrinho();
        avisar(nome + ' removido do pedido.');
      }
    });

    $$('[data-abrir-carrinho]').forEach(function (b) {
      b.addEventListener('click', abrirCarrinho);
    });
    $$('[data-fechar-carrinho]').forEach(function (b) {
      b.addEventListener('click', fecharCarrinho);
    });

    $('#carrinho-limpar').addEventListener('click', function () {
      if (!estado.carrinho.length) return;
      estado.carrinho = [];
      desenharCarrinho();
      avisar('Pedido limpo.');
    });

    $('#carrinho-finalizar').addEventListener('click', enviarWhatsApp);
  }

  function abrirCarrinho() {
    ultimoFoco = document.activeElement;
    $('#carrinho').classList.add('esta-aberto');
    $('#carrinho').setAttribute('aria-hidden', 'false');
    var x = $('.carrinho__x');
    if (x) x.focus();
  }
  function fecharCarrinho() {
    $('#carrinho').classList.remove('esta-aberto');
    $('#carrinho').setAttribute('aria-hidden', 'true');
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }

  /* ------------------------- envio para o WhatsApp ------------------------- */
  function mensagemPedido() {
    var linhas = ['*Pedido — Leguste Pizzaria*', ''];
    estado.carrinho.forEach(function (it) {
      linhas.push('• ' + it.qtd + 'x ' + it.nome +
        (it.massa ? ' (' + it.massa + ')' : '') +
        ' — ' + precoTxt(it.unit * it.qtd));
      if (it.obs) linhas.push('   obs: ' + it.obs);
    });
    linhas.push('');
    linhas.push('*Subtotal: ' + precoTxt(subtotal()) + '*');
    if (D.entrega && D.entrega.gratisNaRegiao) linhas.push('Entrega grátis para a região.');
    linhas.push('');
    linhas.push('Enviado pela apresentação digital.');
    return linhas.join('\n');
  }

  function enviarWhatsApp() {
    if (!estado.carrinho.length) return;
    var zap = (D.contato && D.contato.zap) || '5521992543326';
    var url = 'https://wa.me/' + zap + '?text=' + encodeURIComponent(mensagemPedido());
    window.open(url, '_blank', 'noopener');
    avisar('Abrindo o WhatsApp da Leguste com o seu pedido.');
  }

  /* ============================== 6. CONTEÚDO ============================== */
  /* ==================== 8.5 TELA "PEÇA DO SEU JEITO" ====================
     As três massas da tela clara são AS MESMAS do modal do produto: nome,
     descrição e acréscimo saem do menu.js, sem nenhum dado novo. Se a casa
     mudar o cadastro, as duas telas mudam juntas — não existe segunda
     verdade sobre preço de massa nesta apresentação.                      */
  function montarMassasDaTela() {
    var ul = $('#monte-massas');
    if (!ul) return;
    ul.innerHTML = (D.massas || []).map(function (m) {
      return '<li class="monte__massa">' +
        '<span class="monte__massa-nome">' + m.nome + '</span>' +
        '<span class="monte__massa-desc">' + m.desc + '</span>' +
        '<span class="monte__massa-extra">' + (m.extra ? '+ ' + precoTxt(m.extra) : 'incluso') + '</span>' +
        '</li>';
    }).join('');
  }

  function preencherContato() {
    var c = D.contato || {};
    var r = D.rodizio || {};

    var t = $('#titulo-rodizio'); if (t) t.textContent = r.titulo || '';
    var ol = $('#rodizio-lista');
    if (ol) ol.innerHTML = (r.itens || []).map(function (i) { return '<li>' + i + '</li>'; }).join('');
    var ob = $('#rodizio-obs'); if (ob) ob.textContent = r.observacao || '';

    var rz = $('#rodizio-zap');
    if (rz && c.zap) {
      rz.href = 'https://wa.me/' + c.zap +
        '?text=' + encodeURIComponent('Olá! Gostaria de informações sobre o rodízio da Leguste.');
    }

    var lr = $('#local-rua'); if (lr) lr.textContent = c.endereco || '';
    var lb = $('#local-bairro'); if (lb) lb.textContent = c.bairro || '';

    [['#local-tel1', '#local-tel1-txt', c.tel1, c.zap],
     ['#local-tel2', '#local-tel2-txt', c.tel2, null]].forEach(function (par) {
      var a = $(par[0]), s = $(par[1]);
      if (!a || !s) return;
      s.textContent = par[2] || '';
      a.href = par[3] ? 'https://wa.me/' + par[3] : 'tel:' + String(par[2] || '').replace(/\D/g, '');
      if (par[3]) a.target = '_blank', a.rel = 'noopener';
    });

    var le = $('#local-entrega');
    if (le) le.textContent = (D.entrega && D.entrega.gratisNaRegiao) ? 'Entrega grátis para a região' : '';
    var lt = $('#local-tempo');
    if (lt) lt.textContent = (D.entrega && D.entrega.tempoOficial) ? 'Tempo estimado: ' + D.entrega.tempo
                                                                  : 'O tempo de entrega é confirmado pela Leguste.';
    var la = $('#local-apps');
    if (la && D.entrega) la.textContent = 'Também estamos no ' + D.entrega.apps.join(' e no ') + '.';

    var lm = $('#local-mapa');
    if (lm) lm.href = 'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent('Leguste Pizzaria, ' + c.endereco + ', ' + c.bairro);
    var li = $('#local-insta');
    if (li) li.href = c.instaUrl || '#';

    var fr = $('#fim-rua'); if (fr) fr.textContent = c.endereco || '';
    var fb = $('#fim-bairro'); if (fb) fb.textContent = c.bairro || '';
    var ff = $('#fim-fones'); if (ff) ff.textContent = (c.tel1 || '') + ' · ' + (c.tel2 || '');
    var fi = $('#fim-insta'); if (fi) fi.textContent = c.insta || '';
  }

  /* ============================ 7. NAVEGAÇÃO ============================ */
  function ligarNavegacao() {
    /* menu do celular */
    var bt = $('#btn-menu'), nav = $('#topo-nav-mob');
    if (bt && nav) {
      bt.addEventListener('click', function () {
        var aberto = bt.getAttribute('aria-expanded') === 'true';
        bt.setAttribute('aria-expanded', aberto ? 'false' : 'true');
        bt.setAttribute('aria-label', aberto ? 'Abrir menu' : 'Fechar menu');
        nav.classList.toggle('esta-aberto', !aberto);
      });
      nav.addEventListener('click', function (ev) {
        if (!ev.target.closest('a')) return;
        bt.setAttribute('aria-expanded', 'false');
        nav.classList.remove('esta-aberto');
      });
    }

    /* botões que levam ao cardápio (mesmo se o filtro estiver escondido) */
    $$('[data-ir-cardapio]').forEach(function (b) {
      b.addEventListener('click', function () {
        var alvo = $('#cardapio');
        if (alvo) alvo.scrollIntoView({ behavior: (movReduzido && movReduzido.matches) ? 'auto' : 'smooth' });
      });
    });

    /* escolher / adicionar direto do slide */
    var trilho = $('#trilho');
    if (trilho) {
      trilho.addEventListener('click', function (ev) {
        var e = ev.target.closest('[data-escolher]');
        var d = ev.target.closest('[data-direto]');
        if (e) { ultimoFoco = e; abrirModal(e.getAttribute('data-escolher')); }
        else if (d) {
          var s = acharSabor(d.getAttribute('data-direto'));
          if (s) adicionar(s, 1, 'tradicional', '');
        }
      });
    }
  }

  /* ================== 8. ANIMAÇÕES E DESEMPENHO ================== */
  function ligarCena() {
    var roda = $('#roda');
    var trilho = $('#trilho');
    var hero = $('#inicio');

    /* pausa a roda quando ela sai da tela: economiza bateria de verdade */
    if ('IntersectionObserver' in window && roda && hero) {
      new IntersectionObserver(function (ent) {
        roda.classList.toggle('esta-parada', !ent[0].isIntersecting);
      }, { threshold: 0.02 }).observe(hero);
    }

    /* só carrega as imagens próximas */
    if ('IntersectionObserver' in window && trilho) {
      new IntersectionObserver(function () { recolherImagens(); },
        { root: trilho, threshold: 0.01 }).observe(trilho);
    }
  }

  /* ============================== 9. INÍCIO ============================== */
  function iniciar() {
    if (!D || !D.sabores) {
      avisar('Não foi possível carregar o cardápio.');
      return;
    }
    montarFatos();
    montarFiltros();
    montarTrilho();
    ligarTrilho();
    ligarModal();
    ligarCarrinho();
    ligarNavegacao();
    ligarCena();
    montarMassasDaTela();
    preencherContato();
    desenharCarrinho();
    irPara(0, false);

    /* depois da abertura, esconde a dica de arraste sozinho */
    window.setTimeout(esconderDica, 9000);

    /* se a pessoa não pode ver movimento, entrega o estado final na hora */
    if (movReduzido && movReduzido.matches) {
      document.documentElement.setAttribute('data-movimento-reduzido', 'sim');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
