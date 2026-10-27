let dados = {};

async function carregarJson(ficheiro) {
    const response = await fetch(ficheiro);

    if (!response.ok) {
        throw new Error(`Erro ao carregar ${ficheiro} (${response.status})`);
    }

    return response.json();
}

async function inicializar() {
    try {
        const [
            desportos,
            escaloes,
            clubes,
            equipas,
            localizacoes,
            competicoes
        ] = await Promise.all([
            carregarJson("data/desportos.json"),
            carregarJson("data/escaloes.json"),
            carregarJson("data/clubes.json"),
            carregarJson("data/equipas.json"),
            carregarJson("data/localizacoes.json"),
            carregarJson("data/competicoes.json")
        ]);

        dados = {
            desportos,
            escaloes,
            clubes,
            equipas,
            localizacoes,
            competicoes
        };

        criarMapas();

        atualizarDetalhesVisualizacao(true);
        atualizarOrdenacao(true);
        atualizarDesportos(true);
        atualizarEscaloes(true);
        atualizarEquipasDestaque(true);
    }
    catch (erro) {
        console.error(erro);
        elements.jornadaDiv.innerHTML =
            "<p>Erro ao carregar os dados.</p>";
    }
}

function criarMapa(array) {
    return Object.fromEntries(
        array.map(item => [item.id, item])
    );
}

function criarMapas() {
    dados.mapaDesportos   = criarMapa(dados.desportos);
    dados.mapaEscaloes    = criarMapa(dados.escaloes);
    dados.mapaClubes      = criarMapa(dados.clubes);
    dados.mapaEquipas     = criarMapa(dados.equipas);
    dados.mapaLocais      = criarMapa(dados.localizacoes);
	dados.mapaCompeticoes = criarMapa(dados.competicoes);
	
    dados.mapaSeries      = criarMapaSeries();
	dados.mapaJornadas    = criarMapaJornadas();
}
function criarMapaSeries() {
    const mapa = {};

    dados.competicoes.forEach(comp => {
        comp.series.forEach(serie => {
            mapa[serie.id] = serie;
        });
    });

    return mapa;
}

function criarMapaJornadas() {
    const mapa = {};

    dados.competicoes.forEach(comp => {
        comp.series.forEach(serie => {
            serie.jornadas.forEach(jornada => {
                mapa[jornada.id] = jornada;
            });
        });
    });

    return mapa;
}

inicializar();

const query = new URLSearchParams(window.location.search);
const CLUBE_ISENTO = "0000";

const ORDENACAO = {
    ID: 1,
    DATA_HORA: 2,
	SEM_ORDENACAO: 0
};
const VISUALIZACAO = {
    ESCONDER_ISENTO: 1,
    MOSTRAR_DESTACADA: 2,
	MOSTRAR_TODO: 3
};

const params = {
  desporto: query.get('desporto'),
  escalao: query.get('escalao'),
  serie: query.get('serie'),
  jornada: query.get('jornada'),
  equipaDestaque: query.get('equipaDestaque'),
  esconder: query.get('esconder'),
  ordenacao: query.get('ordenar')
};

const elements = {
  desportoSelect: document.getElementById('desportoSelect'),
  escalaoSelect: document.getElementById('escalaoSelect'),
  serieSelect: document.getElementById('serieSelect'),
  jornadaSelect: document.getElementById('jornadaSelect'),
  jornadaDiv: document.getElementById('jornada'),
  equipaDestaqueSelect: document.getElementById('equipaDestaqueSelect'),
  esconderSelect: document.getElementById('esconderSelect'),
  ordenacaoSelect: document.getElementById('ordenacaoSelect'),
};

// Utility: Create option element
const createOption = (value, text) => {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = text;
  return option;
};

// Utility: Get selected values
const getSelectedValues = () => ({
  desportoId: elements.desportoSelect.value,
  escalaoId: elements.escalaoSelect.value,
  serieId: elements.serieSelect.value,
  jornadaId: elements.jornadaSelect.value,
  equipaDestaqueId: elements.equipaDestaqueSelect.value,
  esconderId: elements.esconderSelect.value,
  ordenacaoId: elements.ordenacaoSelect.value,
});

function aplicarParametro(primeiro, select, valor) {
    if (primeiro && valor && existeValor(select, valor)) {
        select.value = valor;
        return true;
    }
    return false;
}

// Populate Desportos
function atualizarDesportos(primeiro) {
  const fragment = document.createDocumentFragment();

  dados.desportos.forEach(d => {
    fragment.appendChild(createOption(d.id, d.nome)); 
  });

  elements.desportoSelect.appendChild(fragment);

  aplicarParametro(primeiro, elements.desportoSelect, params.desporto);
}

// Populate Escalões
function atualizarEscaloes(primeiro) {
  elements.escalaoSelect.innerHTML = '';
  const { desportoId } = getSelectedValues();

  const escaloesUnicos = [...new Set(
    dados.competicoes.filter(c => c.desportoId === desportoId).map(c => c.escalaoId)
  )];

  const fragment = document.createDocumentFragment();

  escaloesUnicos.forEach(id => {
	const escalao = dados.mapaEscaloes[id];
    if (escalao) fragment.appendChild(createOption(escalao.id, escalao.nome)); 
  });

  elements.escalaoSelect.appendChild(fragment);

  aplicarParametro(primeiro, elements.escalaoSelect, params.escalao);

  atualizarEquipasDestaque(primeiro);
  atualizarSeries(primeiro);
}

// Populate Series
function atualizarSeries(primeiro) {
  elements.serieSelect.innerHTML = '';
  const { desportoId, escalaoId } = getSelectedValues();

  const competicaoId = `${desportoId}.${escalaoId}`;
  const comp = dados.mapaCompeticoes[competicaoId];

  const fragment = document.createDocumentFragment();

  comp?.series.forEach(s => {
	fragment.appendChild(createOption(s.id, s.nomeserie)); 
  });

  elements.serieSelect.appendChild(fragment);

  aplicarParametro(primeiro, elements.serieSelect, params.serie);

  atualizarEquipasDestaque(primeiro);
  atualizarJornadas(primeiro);
}

// Populate Jornadas
function atualizarJornadas(primeiro) {
  elements.jornadaSelect.innerHTML = '';
  const { serieId } = getSelectedValues();

  const serie = dados.mapaSeries[serieId];

  const fragment = document.createDocumentFragment();
	
  serie?.jornadas.forEach(j => {
	fragment.appendChild(createOption(j.id, `Jornada ${j.jornada}`)); 
  });

  elements.jornadaSelect.appendChild(fragment);
  
  if (!aplicarParametro(primeiro,elements.jornadaSelect,params.jornada))
  {
    selecionarJornadaFutura(elements.jornadaSelect,serie?.jornadas);
  }

  atualizarEquipasDestaque(primeiro);
  atualizarCalendario(primeiro);
}

// Select next Jornada
function selecionarJornadaFutura(select, jornadas = []) {
  const hoje = new Date();

  const jornadasOrdenadas = ordenarJornadas(jornadas);

  for (const jornada of jornadasOrdenadas) {
    const dataJornada = addDays(parseDataHora(jornada.data), 1);
    if (dataJornada >= hoje) {
      select.value = jornada.id;
      break;
    }
  }
}

function existeValor(select, value) {
    return select.querySelector(`option[value="${CSS.escape(value)}"]`) !== null;
}

function parseDataHora(data, hora = '23:59') {
    if (!data) { return new Date(9999, 11, 31, 23, 59, 59);}

    const [dia, mes, ano] = data.split('/').map(Number);
    const [h, m] = (hora || '23:59').split(':').map(Number);

    return new Date(ano, mes - 1, dia, h, m);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Populate Equipas Destaque
function atualizarEquipasDestaque(primeiro) {
  elements.equipaDestaqueSelect.innerHTML = '<option value="">(nenhuma)</option>';
  const equipas = equipasFiltradas();
  let highlightedId = null;

  const fragment = document.createDocumentFragment();

  equipas.forEach(e => {
    fragment.appendChild(createOption(e.id, e.nome));
    if (e.highlighted && !highlightedId) { highlightedId = e.id; }
  });

  elements.equipaDestaqueSelect.appendChild(fragment);

  if (!aplicarParametro( primeiro, elements.equipaDestaqueSelect, params.equipaDestaque) && highlightedId ) {
    elements.equipaDestaqueSelect.value = highlightedId;
  }
}

function atualizarDetalhesVisualizacao(primeiro)
{
  aplicarParametro(primeiro, elements.esconderSelect, params.esconder);
}

function atualizarOrdenacao(primeiro)
{
  aplicarParametro(primeiro, elements.ordenacaoSelect, params.ordenacao);
}

// Filter Equipas
function equipasFiltradas() {
  const { serieId } = getSelectedValues();

  const serie = dados.mapaSeries[serieId];
	
  if (!serie) return [];
  
  return serie.equipas.map(id => dados.mapaEquipas[id]).filter(Boolean);
}

// Color helpers
function corEquipasFundo(base) {
  if (!base || base.toLowerCase() === '#ffffff' || base.toLowerCase() === 'white') {
    return '#e0e0e0';
  }
  return ajustarLuminosidade(base, -20);
}

function ajustarLuminosidade(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;

  return '#' + (
    0x1000000 +
    (Math.max(0, Math.min(255, R)) << 16) +
    (Math.max(0, Math.min(255, G)) << 8) +
    Math.max(0, Math.min(255, B))
  ).toString(16).slice(1);
}

function ordenarPorData(items) {
    return [...items].sort((a, b) => {
        const dataA = parseDataHora(a.data, a.hora).getTime();
        const dataB = parseDataHora(b.data, b.hora).getTime();
        return dataA - dataB;
    });
}

function ordenarJogos(jogos, tipo) {
    switch (Number(tipo)) {
        case ORDENACAO.ID:
            return [...jogos].sort((a, b) => a.id.localeCompare(b.id));
        case ORDENACAO.DATA_HORA:
            return ordenarPorData(jogos);
        default:
            return [...jogos];
    }
}

function ordenarJornadas(jornadas) { 
	return ordenarPorData(jornadas);
}

// Render Calendar
function atualizarCalendario() {
  const { desportoId, escalaoId, serieId, jornadaId, ordenacaoId, equipaDestaqueId, esconderId } = getSelectedValues();

  const serie = dados.mapaSeries[serieId];
  const jornada = dados.mapaJornadas[jornadaId];
	
  elements.jornadaDiv.replaceChildren();

  const fragment = document.createDocumentFragment();

  const titulo = document.createElement("h2");
  titulo.className = "responsive-heading mb-3";
  titulo.textContent =
	`${dados.mapaDesportos[desportoId]?.nome} – ` +
    `${dados.mapaEscaloes[escalaoId]?.nome} – ` +
    `Série ${serie?.serie} – Jornada ${jornada?.jornada} (${jornada?.data})`;

    fragment.appendChild(titulo);

    ordenarJogos(jornada?.jogos ?? [], ordenacaoId)
      .forEach(jogo => {
        const card = renderJogoCard(jogo, equipaDestaqueId, esconderId );

        if (card) { fragment.appendChild(card); }
      });
  elements.jornadaDiv.appendChild(fragment);
}
	
function renderJogoCard(jogo, equipaDestaqueId, esconderId) {
    const equipaCasa = dados.mapaEquipas[jogo.equipacasa];
    const equipaFora = dados.mapaEquipas[jogo.equipafora];
    const equipaDestaque = dados.mapaEquipas[equipaDestaqueId];

    const local = dados.mapaLocais[jogo.localizacaoId];

    const casa = equipaCasa?.nome || jogo.equipacasa;
    const fora = equipaFora?.nome || jogo.equipafora;

    const destacar = jogo.equipacasa === equipaDestaqueId || jogo.equipafora === equipaDestaqueId;
    const isento = equipaCasa?.clubeId === CLUBE_ISENTO || equipaFora?.clubeId === CLUBE_ISENTO;

    if (Number(esconderId) === VISUALIZACAO.ESCONDER_ISENTO && isento ) { return null; }

    if (Number(esconderId) === VISUALIZACAO.MOSTRAR_DESTACADA && !destacar ) { return null; }

    const corFundo = obterCorFundo(isento, destacar, equipaDestaque);

    const fundoEquipas = (isento || destacar) ? corEquipasFundo(corFundo) : "#e0e0e0";

    const resultado = jogo.resultado
        ? `<span class="mx-2">${jogo.resultado}</span>`
        : '<span class="mx-2">vs</span>';

    const localInfo = obterLocalizacao(local);

    const card = document.createElement("div");

    card.className = "jogo-card";

    card.style.backgroundColor = corFundo;
    card.style.borderColor = fundoEquipas;

    card.innerHTML = `
        <div class="jogo-topo shadow-box-sm">
            <div class="jogo-info"
                 style="background-color:${fundoEquipas}; border-radius:10px; padding:0.75rem 1rem;">
                <div><strong>ID:</strong> ${jogo.id}</div>
                <div><strong>Data:</strong> ${jogo.data || ''}</div>
                <div><strong>Hora:</strong> ${jogo.hora || ''}</div>
            </div>

            <div class="jogo-equipas"
                 style="background-color:${fundoEquipas};">
                <strong>${casa}</strong>
                ${resultado}
                <strong>${fora}</strong>

                <div class="jogo-local">
                    ${localInfo}
                </div>
            </div>
        </div>
    `;

    return card;
}

function obterCorFundo(isento, destacar, equipaDestaque) {
    if (isento) {
        return dados.mapaClubes[CLUBE_ISENTO]?.cor || "#e8e8e8";
    }
    else if (destacar) {
        return dados.mapaClubes[equipaDestaque?.clubeId]?.cor || "#ffffcc";
    }
    else
    	return "#f2f2f2";
}

function obterLocalizacao(local)
{
    if (!local?.nome){ return "Sem localização definida."; }

    let html = `<b>${local.nome}</b>`;

    if (local.relvado || local.dimensoes?.comprimento || local.dimensoes?.largura)
    {
        html += ` (${local.relvado || ""}`;
		
        if (local.dimensoes?.comprimento){ html += ` ${local.dimensoes.comprimento}`; }
        if (local.dimensoes?.largura){ html += `x${local.dimensoes.largura}`; }

        html += ")";
    }

	if (local.georef?.link)
	{
	    html += `<div class="mt-1">📍 <a href="${local.georef.link}"target="_blank" rel="noopener noreferrer"><strong>VER NO MAPA</strong></a></div>`;
	}

    return html;
}




