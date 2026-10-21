let dados;
const query = new URLSearchParams(window.location.search);
const CLUBE_ISENTO = "0000";

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

function obterCompeticao(desportoId, escalaoId) {
    return dados.competicoes.find( c => c.desportoId === desportoId && c.escalaoId === escalaoId );
}

function obterSerie(desportoId, escalaoId, serieId) {
    return obterCompeticao(desportoId, escalaoId)?.series.find( s => s.serie === serieId );
}

function obterJornada(desportoId, escalaoId, serieId, jornadaId) {
    return obterSerie(desportoId, escalaoId, serieId)?.jornadas.find(j => j.jornada === jornadaId);
}

// Populate Desportos
function atualizarDesportos(primeiro) {
  dados.desportos.forEach(d => {
    elements.desportoSelect.appendChild(createOption(d.id, d.nome));
  });

  aplicarParametro(primeiro, elements.desportoSelect, params.desporto);
}

// Populate Escalões
function atualizarEscaloes(primeiro) {
  elements.escalaoSelect.innerHTML = '';
  const { desportoId } = getSelectedValues();

  const escaloesUnicos = [...new Set(
    dados.competicoes.filter(c => c.desportoId === desportoId).map(c => c.escalaoId)
  )];

  escaloesUnicos.forEach(id => {
    const escalao = dados.escaloes.find(e => e.id === id);
    if (escalao) elements.escalaoSelect.appendChild(createOption(escalao.id, escalao.nome));
  });

  aplicarParametro(primeiro, elements.escalaoSelect, params.escalao);

  atualizarEquipasDestaque(primeiro);
  atualizarSeries(primeiro);
}

// Populate Series
function atualizarSeries(primeiro) {
  elements.serieSelect.innerHTML = '';
  const { desportoId, escalaoId } = getSelectedValues();

  const comp = obterCompeticao(desportoId, escalaoId);

  comp?.series.forEach(s => {
    elements.serieSelect.appendChild(createOption(s.serie, s.nomeserie));
  });

  aplicarParametro(primeiro, elements.serieSelect, params.serie);

  atualizarEquipasDestaque(primeiro);
  atualizarJornadas(primeiro);
}

// Populate Jornadas
function atualizarJornadas(primeiro) {
  elements.jornadaSelect.innerHTML = '';
  const { desportoId, escalaoId, serieId } = getSelectedValues();

  const serie = obterSerie(desportoId, escalaoId, serieId);

  serie?.jornadas.forEach(j => {
    elements.jornadaSelect.appendChild(createOption(j.jornada, `Jornada ${j.jornada}`));
  });
  
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
      select.value = jornada.jornada;
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
    const [h, m] = hora.split(':').map(Number);

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

  equipas.forEach(e => {
    elements.equipaDestaqueSelect.appendChild(createOption(e.id, e.nome));
    if (e.highlighted && !highlightedId) highlightedId = e.id;
  });

  if (!aplicarParametro( primeiro, elements.equipaDestaqueSelect, params.equipaDestaque) && highlightedId ) {
    elements.equipaDestaqueSelect.value = highlightedId;
  }
}

function atualizarDetalhesVisualizacao(primeiro)
{
  aplicarParametro(primeiro, elements.esconderSelect, params.esconder);
}

// Filter Equipas
function equipasFiltradas() {
  const { desportoId, escalaoId, serieId } = getSelectedValues();

  const serie = obterSerie(desportoId, escalaoId, serieId);

  if (!serie) return [];

  return dados.equipas.filter(e =>
    e.desportoId === desportoId &&
    e.escalaoId === escalaoId &&
    serie.equipas.includes(e.id)
  );
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
    return [...items].sort( (a, b) => parseDataHora(a.data, a.hora) - parseDataHora(b.data, b.hora) );
}

function ordenarJogos(jogos, tipo) {
    switch (Number(tipo)) {
        case 1: // ID
            return [...jogos].sort((a, b) => a.id.localeCompare(b.id));
        case 2: // Data + Hora
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
  const { desportoId, escalaoId, serieId, jornadaId } = getSelectedValues();

  const serie = obterSerie(desportoId, escalaoId, serieId);
  const jornada = obterJornada(desportoId, escalaoId, serieId, jornadaId);

  const {ordenacaoId } = getSelectedValues();
	
  elements.jornadaDiv.innerHTML = `
    <h2 class="responsive-heading mb-3">
      ${dados.desportos.find(d => d.id === desportoId)?.nome} – 
      ${dados.escaloes.find(e => e.id === escalaoId)?.nome} – 
      Série ${serie?.serie} – Jornada ${jornada?.jornada} (${jornada?.data})
    </h2>
    ${ordenarJogos(jornada?.jogos ?? [], ordenacaoId).map(renderJogoCard).join('')}
  `;

  function renderJogoCard(jogo) {
    const { equipaDestaqueId, esconderId } = getSelectedValues();
	
	const equipaCasa = dados.mapaEquipas[jogo.equipacasa];
	const equipaFora = dados.mapaEquipas[jogo.equipafora];
	const equipaDestaque = dados.mapaEquipas[equipaDestaqueId];
	  
    const local = dados.mapaLocais[jogo.localizacaoId];

    const casa = equipaCasa?.nome || jogo.equipacasa;
    const fora = equipaFora?.nome || jogo.equipafora;
	  
    const destacar = jogo.equipacasa === equipaDestaqueId || jogo.equipafora === equipaDestaqueId;	  
    const isento = equipaCasa?.clubeId === CLUBE_ISENTO || equipaFora?.clubeId === CLUBE_ISENTO;

    if(Number(esconderId) === 1 && isento ){ return ``; }
	else if(Number(esconderId) === 2 && !destacar ){ return ``; }
	
    let corFundo = "#f2f2f2";
    if (isento) {
      corFundo = dados.mapaClubes[0]?.cor || "#e8e8e8";
    } else if (destacar) {
      corFundo = dados.mapaClubes[equipaDestaque?.clubeId]?.cor || '#ffffcc';
    }

    const fundoEquipas = (isento || destacar) ? corEquipasFundo(corFundo) : "#e0e0e0";
    const resultado = jogo.resultado || '<span class="mx-2">vs</span>';
    const localInfo = local?.nome
      ? `<b>${local.nome}</b> (${local.relvado || ''} ${local.dimensoes?.comprimento || ''}x${local.dimensoes?.largura || ''})` +
        (local.georef?.link ? `<div><a href="${local.georef.link}" target="_blank"><strong>VER NO MAPA</strong></a></div>` : '')
      : 'Sem localização definida.';

    return `
      <div class="jogo-card" style="background-color: ${corFundo}; border-color: ${fundoEquipas};">
        <div class="jogo-topo shadow-box-sm">
          <div class="jogo-info" style="background-color: ${fundoEquipas}; border-radius: 10px; padding: 0.75rem 1rem;">
            <div><strong>ID:</strong> ${jogo.id}</div>
            <div><strong>Data:</strong> ${jogo.data || ''}</div>
            <div><strong>Hora:</strong> ${jogo.hora || ''}</div>
          </div>
          <div class="jogo-equipas" style="background-color: ${fundoEquipas};">
            <strong>${casa}</strong>
            ${jogo.resultado ? `<span class="mx-2">${jogo.resultado}</span>` : '<span class="mx-2">vs</span>'}
            <strong>${fora}</strong>
            <div class="jogo-local">${localInfo}</div>
          </div>
        </div>
      </div>
    `;
  }
}



