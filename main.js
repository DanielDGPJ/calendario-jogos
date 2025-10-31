let dados;
const desportoSelect = document.getElementById('desportoSelect');
const escalaoSelect = document.getElementById('escalaoSelect');
const serieSelect = document.getElementById('serieSelect');
const jornadaSelect = document.getElementById('jornadaSelect');
const jornadaDiv = document.getElementById('jornada');
const equipaDestaqueSelect = document.getElementById('equipaDestaqueSelect');
	
// Preencher desportos
function atualizarDesportos() {
	dados.desportos.forEach(d => {
		const option = document.createElement('option');
		option.value = d.id;
		option.textContent = d.nome;
		desportoSelect.appendChild(option);
	});
}

function atualizarEscaloes(){
	escalaoSelect.innerHTML = '';
	const desportoId = desportoSelect.value;
	const escaloesFiltrados = dados.competicoes.filter(c => c.desportoId === desportoId).map(c => c.escalaoId);

	const escaloesUnicos = [...new Set(escaloesFiltrados)];
	escaloesUnicos.forEach(id => {
		const escalao = dados.escaloes.find(e => e.id === id);
        const option = document.createElement('option');
        option.value = escalao.id;
        option.textContent = escalao.nome;
        escalaoSelect.appendChild(option);
	});
	  
	atualizarEquipasDestaque();
	atualizarSeries();
}

function atualizarSeries() {
	serieSelect.innerHTML = '';
	const desportoId = desportoSelect.value;
	const escalaoId = escalaoSelect.value;
	const comp = dados.competicoes.find(c => c.desportoId === desportoId && c.escalaoId === escalaoId);

	comp?.series.forEach((s, i) => {
		const option = document.createElement('option');
		option.value = i;
        option.textContent = `Série ${s.serie}`;
        serieSelect.appendChild(option);
	});

	atualizarEquipasDestaque();
	atualizarJornadas();
}

function atualizarJornadas() {
	jornadaSelect.innerHTML = '';
	const desportoId = desportoSelect.value;
	const escalaoId = escalaoSelect.value;
	const serieIndex = serieSelect.value;
	const comp = dados.competicoes.find(c => c.desportoId === desportoId && c.escalaoId === escalaoId);
	const serie = comp?.series[serieIndex];	  

	serie?.jornadas.forEach((j, i) => {
		const option = document.createElement('option');
        option.value = i;
        option.textContent = `Jornada ${j.jornada}`;
        jornadaSelect.appendChild(option);
	});
    selecionarJornadaFutura("jornadaSelect", serie?.jornadas);
	atualizarEquipasDestaque();
	atualizarCalendario();
}

function selecionarJornadaFutura(selectId, jornadas) {
  const hoje = new Date();
  const select = document.getElementById(selectId);

  // Ordena jornadas por data crescente
  const jornadasOrdenadas = jornadas.sort((a, b) => {
    const [diaA, mesA, anoA] = a.data.split('/').map(Number);
    const [diaB, mesB, anoB] = b.data.split('/').map(Number);
    const dataA = new Date(anoA, mesA - 1, diaA);
    const dataB = new Date(anoB, mesB - 1, diaB);
    return dataA - dataB;
  });

  // Procura a primeira jornada com data futura
  for (const jornada of jornadasOrdenadas) {
    const [dia, mes, ano] = jornada.data.split('/').map(Number);
    const dataJornada = new Date(ano, mes - 1, dia);
    if (dataJornada > hoje) {
		  console.log("selecionarJornadaFutura " + dataJornada + " - " + hoje + " -- " +dataJornada > hoje);       // General output
      select.value = jornada.id;
      break;
    }
  }
}

function atualizarEquipasDestaque() {	  
	equipaDestaqueSelect.innerHTML = '<option value="">(nenhuma)</option>';
	const equipas = equipasFiltradas();	  

	let highlightedId = null;
	  
	equipas.forEach(e => {
		const clube = dados.clubes.find(c => c.id === e.clubeId);
		const nome = `${e.nome}`;
		const option = document.createElement('option');
		option.value = e.id; // ← valor correto
		option.textContent = nome;
		equipaDestaqueSelect.appendChild(option);
		
		if (e.highlighted && highlightedId === null) {
		  highlightedId = e.id;
		}
	});
	  
	// Seleciona a equipa destacada por omissão, se existir
	if (highlightedId !== null) {
        equipaDestaqueSelect.value = highlightedId;
	}
}
	
function equipasFiltradas() {
	const desportoId = desportoSelect.value;
	const escalaoId = escalaoSelect.value;
	const serieIndex = serieSelect.value;

	const comp = dados.competicoes.find(c => c.desportoId === desportoId && c.escalaoId === escalaoId);
	const serie = comp?.series[serieIndex];

	if (!serie) return [];

	return dados.equipas.filter(e =>
		e.desportoId === desportoId &&
		e.escalaoId === escalaoId &&
		serie.equipas.includes(e.id)
	);
}

// Função para calcular cor de fundo alternativa
function corEquipasFundo(base) {
	if (!base || base === '#ffffff' || base.toLowerCase() === 'white') {
		return '#e0e0e0'; // cinzento claro
	}
	return ajustarLuminosidade(base, -20); // escurece ligeiramente
}

	// Função para escurecer uma cor hex (simplificada)
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

function atualizarCalendario() {
	const desportoId = desportoSelect.value;
	const escalaoId = escalaoSelect.value;
	const serieIndex = serieSelect.value;
	const jornadaIndex = jornadaSelect.value;
	const comp = dados.competicoes.find(c => c.desportoId === desportoId && c.escalaoId === escalaoId);
	const serie = comp?.series[serieIndex];
	const jornada = serie?.jornadas[jornadaIndex];

	const mapaEquipas = Object.fromEntries(dados.equipas.map(e => { return [e.id, `${e.nome}`];}));
  


  const mapaLocais = Object.fromEntries(dados.localizacoes.map(l => [l.id, l]));

	jornadaDiv.innerHTML = `
		<h2 class="responsive-heading mb-3">
		${dados.desportos.find(d => d.id === desportoId)?.nome} – 
		${dados.escaloes.find(e => e.id === escalaoId)?.nome} – 
		Série ${serie?.serie} – Jornada ${jornada?.jornada} (${jornada?.data})
		</h2>

    ${jornada?.jogos.map(jogo => {
		const data = jogo.data || '';
		const horas = jogo.hora || '';
		const casa = mapaEquipas[jogo.equipacasa] || jogo.equipacasa;
		const fora = mapaEquipas[jogo.equipafora] || jogo.equipafora;
		const resultado = jogo.resultado || '';
		const local = jogo.localizacaoId ? mapaLocais[jogo.localizacaoId] : null;
		const temLocalizacao = local && local.nome;
		const temLocalGeo = temLocalizacao && local.georef?.link;

		const equipaDestaqueId = equipaDestaqueSelect.value;
		const destacar = jogo.equipacasa === equipaDestaqueId || jogo.equipafora === equipaDestaqueId;

		const equipaCasa = dados.equipas.find(e => e.id === jogo.equipacasa);
		const equipaFora = dados.equipas.find(e => e.id === jogo.equipafora);
		const destacarIsento = equipaCasa?.clubeId === "0000" || equipaFora?.clubeId === "0000";

		let corFundo = "";
		if (destacarIsento) {
			const clubeIsento = dados.clubes.find(c => c.id === 0);
			corFundo = clubeIsento?.cor || "#e8e8e8";
		} else if (destacar) {
			const equipa = dados.equipas.find(e => e.id === equipaDestaqueId);
			const clube = dados.clubes.find(c => c.id === equipa?.clubeId);
			corFundo = clube?.cor || "#ffffcc";
		}
		
	const fundoEquipas = corEquipasFundo(corFundo);

	return `
        <div class="jogo-card" style="background-color: ${corFundo};border-color: ${fundoEquipas};">
		    <div class="jogo-topo shadow-box-sm">
				<div class="jogo-info" style="background-color: ${fundoEquipas}; border-radius: 10px; padding: 0.75rem 1rem;">
					<div><strong>ID:</strong> ${jogo.id}</div>
					<div><strong>Data:</strong> ${data}</div>
					<div><strong>Hora:</strong> ${horas}</div>
				</div>
				<div class="jogo-equipas" style="background-color: ${fundoEquipas};">
					<strong>${casa}</strong>
					${resultado ? `<span class="mx-2">${resultado}</span>` : '<span class="mx-2">vs</span>'}
					<strong>${fora}</strong>
				<div class="jogo-local">
					${temLocalizacao
					? `<b>${local.nome || ''}</b> (${local.relvado || ''} ${local.dimensoes?.comprimento || ''}x${local.dimensoes?.largura || ''}) ${temLocalGeo ? `<div><a href="${local.georef.link}" target="_blank"><strong>VER NO MAPA</strong></a></div>` : ''}`
					: 'Sem localização definida.'}
				</div>
			</div>
        </div>
    </div>
      `;
    }).join('')}
  `;

}





