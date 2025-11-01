let dados;

const elements = {
  desportoSelect: document.getElementById('desportoSelect'),
  escalaoSelect: document.getElementById('escalaoSelect'),
  serieSelect: document.getElementById('serieSelect'),
  jornadaSelect: document.getElementById('jornadaSelect'),
  jornadaDiv: document.getElementById('jornada'),
  equipaDestaqueSelect: document.getElementById('equipaDestaqueSelect'),
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
});

// Populate Desportos
function atualizarDesportos() {
  dados.desportos.forEach(d => {
    elements.desportoSelect.appendChild(createOption(d.id, d.nome));
  });
}

// Populate Escalões
function atualizarEscaloes() {
  elements.escalaoSelect.innerHTML = '';
  const { desportoId } = getSelectedValues();

  const escaloesUnicos = [...new Set(
    dados.competicoes.filter(c => c.desportoId === desportoId).map(c => c.escalaoId)
  )];

  escaloesUnicos.forEach(id => {
    const escalao = dados.escaloes.find(e => e.id === id);
    if (escalao) elements.escalaoSelect.appendChild(createOption(escalao.id, escalao.nome));
  });

  atualizarEquipasDestaque();
  atualizarSeries();
}

// Populate Series
function atualizarSeries() {
  elements.serieSelect.innerHTML = '';
  const { desportoId, escalaoId } = getSelectedValues();
  const comp = dados.competicoes.find(c => c.desportoId === desportoId && c.escalaoId === escalaoId);

  comp?.series.forEach(s => {
    elements.serieSelect.appendChild(createOption(s.serie, `Série ${s.serie}`));
  });

  atualizarEquipasDestaque();
  atualizarJornadas();
}

// Populate Jornadas
function atualizarJornadas() {
  elements.jornadaSelect.innerHTML = '';
  const { desportoId, escalaoId, serieId } = getSelectedValues();
  const comp = dados.competicoes.find(c => c.desportoId === desportoId && c.escalaoId === escalaoId);
  const serie = comp?.series.find(s => s.serie === serieId);

  serie?.jornadas.forEach(j => {
    elements.jornadaSelect.appendChild(createOption(j.jornada, `Jornada ${j.jornada}`));
  });

  selecionarJornadaFutura(elements.jornadaSelect.id, serie?.jornadas);
  atualizarEquipasDestaque();
  atualizarCalendario();
}

// Select next Jornada
function selecionarJornadaFutura(selectId, jornadas = []) {
  const hoje = new Date();
  const select = document.getElementById(selectId);

  const sorted = [...jornadas].sort((a, b) => {
    const dateA = parseDate(a.data);
    const dateB = parseDate(b.data);
    return dateA - dateB;
  });

  for (const jornada of sorted) {
    const dataJornada = addDays(parseDate(jornada.data), 1);
    if (dataJornada >= hoje) {
      select.value = jornada.jornada;
      break;
    }
  }
}

// Parse DD/MM/YYYY to Date
function parseDate(str) {
  const [d, m, y] = str.split('/').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Populate Equipas Destaque
function atualizarEquipasDestaque() {
  elements.equipaDestaqueSelect.innerHTML = '<option value="">(nenhuma)</option>';
  const equipas = equipasFiltradas();
  let highlightedId = null;

  equipas.forEach(e => {
    elements.equipaDestaqueSelect.appendChild(createOption(e.id, e.nome));
    if (e.highlighted && !highlightedId) highlightedId = e.id;
  });

  if (highlightedId) elements.equipaDestaqueSelect.value = highlightedId;
}

// Filter Equipas
function equipasFiltradas() {
  const { desportoId, escalaoId, serieId } = getSelectedValues();
  const comp = dados.competicoes.find(c => c.desportoId === desportoId && c.escalaoId === escalaoId);
  const serie = comp?.series.find(s => s.serie === serieId);
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

// Render Calendar
function atualizarCalendario() {
  const { desportoId, escalaoId, serieId, jornadaId } = getSelectedValues();
  const comp = dados.competicoes.find(c => c.desportoId === desportoId && c.escalaoId === escalaoId);
  const serie = comp?.series.find(s => s.serie === serieId);
  const jornada = serie?.jornadas.find(j => j.jornada === jornadaId);

  const mapaEquipas = Object.fromEntries(dados.equipas.map(e => [e.id, e.nome]));
  const mapaLocais = Object.fromEntries(dados.localizacoes.map(l => [l.id, l]));

  elements.jornadaDiv.innerHTML = `
    <h2 class="responsive-heading mb-3">
      ${dados.desportos.find(d => d.id === desportoId)?.nome} – 
      ${dados.escaloes.find(e => e.id === escalaoId)?.nome} – 
      Série ${serie?.serie} – Jornada ${jornada?.jornada} (${jornada?.data})
    </h2>
    ${jornada?.jogos.map(renderJogoCard).join('')}
  `;

  function renderJogoCard(jogo) {
    const equipaDestaqueId = elements.equipaDestaqueSelect.value;
    const casa = mapaEquipas[jogo.equipacasa] || jogo.equipacasa;
    const fora = mapaEquipas[jogo.equipafora] || jogo.equipafora;
    const local = mapaLocais[jogo.localizacaoId] || null;
    const destacar = [jogo.equipacasa, jogo.equipafora].includes(equipaDestaqueId);
    const isento = ["0000"].includes(dados.equipas.find(e => e.id === jogo.equipacasa)?.clubeId) ||
                   ["0000"].includes(dados.equipas.find(e => e.id === jogo.equipafora)?.clubeId);

    let corFundo = "#fff";
    if (isento) {
      corFundo = dados.clubes.find(c => c.id === 0)?.cor || "#e8e8e8";
    } else if (destacar) {
      const equipa = dados.equipas.find(e => e.id === equipaDestaqueId);
      corFundo = dados.clubes.find(c => c.id === equipa?.clubeId)?.cor || "#ffffcc";
    }

    const fundoEquipas = corEquipasFundo(corFundo);
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
