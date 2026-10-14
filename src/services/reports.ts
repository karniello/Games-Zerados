import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Game, UserProfile } from '../types';
import { DIFFICULTIES } from '../constants/initialData';

export function exportGamesToExcel(games: Game[], user: UserProfile) {
  const wb = XLSX.utils.book_new();

  // 1. Sheet 1: Resumo Geral & Estatísticas
  const totalGames = games.length;
  const totalHours = games.reduce((s, g) => s + (g.hours || 0), 0);
  const avgScore = totalGames > 0 ? (games.reduce((s, g) => s + g.rating, 0) / totalGames).toFixed(1) : '0';
  const totalPlatinas = games.filter(
    (g) => g.completionCondition.includes('Platina') || g.completionCondition.includes('100%')
  ).length;

  const summaryData = [
    ['GAMEVAULT - DIÁRIO DE JOGOS ZERADOS'],
    ['Relatório Geral de Estatísticas e Desempenho'],
    [],
    ['Gamer:', user.name, 'GamerTag:', user.gamerTag],
    ['Data do Relatório:', new Date().toLocaleDateString('pt-BR'), 'Total de Jogos:', totalGames],
    ['Horas Totais:', `${totalHours} horas`, 'Nota Média:', `★ ${avgScore} / 10`],
    ['Platinas / 100%:', `${totalPlatinas} títulos`, 'Média Horas/Jogo:', `${totalGames > 0 ? (totalHours / totalGames).toFixed(1) : 0}h`],
    [],
    ['DISTRIBUIÇÃO POR NÍVEL DE DIFICULDADE'],
    ['Dificuldade', 'Quantidade de Jogos', 'Percentual', 'Horas Totais', 'Nota Média'],
  ];

  DIFFICULTIES.forEach((diff) => {
    const count = games.filter((g) => g.difficulty === diff).length;
    const pct = totalGames > 0 ? `${((count / totalGames) * 100).toFixed(0)}%` : '0%';
    const hours = games.filter((g) => g.difficulty === diff).reduce((s, g) => s + (g.hours || 0), 0);
    const score = count > 0 ? (games.filter((g) => g.difficulty === diff).reduce((s, g) => s + g.rating, 0) / count).toFixed(1) : '-';
    summaryData.push([diff, count, pct, `${hours}h`, score]);
  });

  summaryData.push([]);
  summaryData.push(['HISTÓRICO CONSOLIDADO POR ANO']);
  summaryData.push(['Ano', 'Jogos Zerados', 'Horas Totais', 'Média Horas/Jogo', 'Nota Média', 'Platinas/100%']);

  // Group by Year
  const yearMap: { [yr: string]: Game[] } = {};
  games.forEach((g) => {
    const yr = g.completedDate ? g.completedDate.substring(0, 4) : 'Outros';
    if (!yearMap[yr]) yearMap[yr] = [];
    yearMap[yr].push(g);
  });

  const sortedYears = Object.keys(yearMap).sort((a, b) => {
    if (a === 'Outros') return 1;
    if (b === 'Outros') return -1;
    return parseInt(b, 10) - parseInt(a, 10);
  });

  sortedYears.forEach((yr) => {
    const yGames = yearMap[yr];
    const count = yGames.length;
    const hours = yGames.reduce((s, g) => s + (g.hours || 0), 0);
    const avgH = (hours / count).toFixed(1);
    const avgR = (yGames.reduce((s, g) => s + g.rating, 0) / count).toFixed(1);
    const plats = yGames.filter((g) => g.completionCondition.includes('Platina') || g.completionCondition.includes('100%')).length;
    summaryData.push([yr, count, `${hours}h`, `${avgH}h`, `★ ${avgR}`, plats]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo & Estatísticas');

  // 2. Sheet 2: Lista Completa de Jogos
  const gamesRows = games.map((g, idx) => ({
    '#': idx + 1,
    'Título do Jogo': g.title,
    'Console / Plataforma': g.platform,
    'Gênero': g.genre,
    'Condição de Zeramento': g.completionCondition,
    'Nota (0-10)': g.rating,
    'Dificuldade': g.difficulty,
    'Tempo (Horas)': g.hours,
    'Data de Conclusão': g.completedDate,
    'Ano Lançamento': g.releaseYear || '',
    'Desenvolvedora': g.developer || '',
    'Favorito': g.favorite ? 'Sim' : 'Não',
    'Anotações / Review': g.notes || '',
  }));

  const wsGames = XLSX.utils.json_to_sheet(gamesRows);
  XLSX.utils.book_append_sheet(wb, wsGames, 'Lista de Jogos Zerados');

  const todayStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `GameVault_Relatorio_Jogos_Zerados_${todayStr}.xlsx`);
}

export function exportStatsToPDF(games: Game[], user: UserProfile) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const primaryColor: [number, number, number] = [79, 70, 229]; // Indigo #4f46e5
  const darkTextColor: [number, number, number] = [30, 41, 59]; // Slate 800
  const secondaryColor: [number, number, number] = [100, 116, 139]; // Slate 500

  // 1. Header & Title
  doc.setFillColor(15, 23, 42); // Slate 900 background for top header bar
  doc.rect(0, 0, 595, 80, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('GAMEVAULT', 40, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(203, 213, 225);
  doc.text('Diário de Jogos Zerados • Relatório Executivo de Estatísticas', 40, 60);

  // User meta on top right
  doc.setFontSize(9);
  doc.setTextColor(199, 210, 254);
  doc.text(`Gamer: ${user.name} (${user.gamerTag})`, 555, 40, { align: 'right' });
  doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')}`, 555, 55, { align: 'right' });

  // 2. Summary KPI Cards
  let currentY = 105;

  const totalGames = games.length;
  const totalHours = games.reduce((s, g) => s + (g.hours || 0), 0);
  const avgScore = totalGames > 0 ? (games.reduce((s, g) => s + g.rating, 0) / totalGames).toFixed(1) : '0.0';
  const totalPlatinas = games.filter(
    (g) => g.completionCondition.includes('Platina') || g.completionCondition.includes('100%')
  ).length;

  const kpis = [
    { label: 'JOGOS ZERADOS', val: `${totalGames} títulos` },
    { label: 'HORAS TOTAIS', val: `${totalHours} horas` },
    { label: 'NOTA MÉDIA', val: `${avgScore} / 10` },
    { label: 'PLATINAS / 100%', val: `${totalPlatinas} jogos` },
  ];

  const cardWidth = 120;
  const cardGap = 12;
  let startX = 40;

  kpis.forEach((kpi) => {
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.roundedRect(startX, currentY, cardWidth, 48, 6, 6, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...secondaryColor);
    doc.text(kpi.label, startX + 10, currentY + 16);

    doc.setFontSize(13);
    doc.setTextColor(...primaryColor);
    doc.text(kpi.val, startX + 10, currentY + 36);

    startX += cardWidth + cardGap;
  });

  currentY += 68;

  // 3. Section: Distribuição por Dificuldade
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...darkTextColor);
  doc.text('Distribuição por Nível de Dificuldade', 40, currentY);
  currentY += 10;

  const diffBody = DIFFICULTIES.map((diff) => {
    const count = games.filter((g) => g.difficulty === diff).length;
    const pct = totalGames > 0 ? `${((count / totalGames) * 100).toFixed(0)}%` : '0%';
    const hours = games.filter((g) => g.difficulty === diff).reduce((s, g) => s + (g.hours || 0), 0);
    const score = count > 0 ? (games.filter((g) => g.difficulty === diff).reduce((s, g) => s + g.rating, 0) / count).toFixed(1) : '-';
    return [diff, count.toString(), pct, `${hours}h`, score !== '-' ? `${score} / 10` : '-'];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Nível de Dificuldade', 'Quantidade de Jogos', 'Percentual', 'Tempo Total', 'Nota Média']],
    body: diffBody,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: darkTextColor,
    },
    margin: { left: 40, right: 40 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 25;

  // 4. Section: Histórico por Ano
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...darkTextColor);
  doc.text('Histórico Consolidado de Zeramentos por Ano', 40, currentY);
  currentY += 10;

  const yearMap: { [yr: string]: Game[] } = {};
  games.forEach((g) => {
    const yr = g.completedDate ? g.completedDate.substring(0, 4) : 'Outros';
    if (!yearMap[yr]) yearMap[yr] = [];
    yearMap[yr].push(g);
  });

  const sortedYears = Object.keys(yearMap).sort((a, b) => {
    if (a === 'Outros') return 1;
    if (b === 'Outros') return -1;
    return parseInt(b, 10) - parseInt(a, 10);
  });

  const yearBody = sortedYears.map((yr) => {
    const yGames = yearMap[yr];
    const count = yGames.length;
    const hours = yGames.reduce((s, g) => s + (g.hours || 0), 0);
    const avgH = (hours / count).toFixed(1);
    const avgR = (yGames.reduce((s, g) => s + g.rating, 0) / count).toFixed(1);
    const plats = yGames.filter((g) => g.completionCondition.includes('Platina') || g.completionCondition.includes('100%')).length;
    return [yr, count.toString(), `${hours}h`, `${avgH}h`, `${avgR} / 10`, `${plats} jogos`];
  });

  // Add total row
  yearBody.push([
    'TOTAL GERAL',
    totalGames.toString(),
    `${totalHours}h`,
    `${totalGames > 0 ? (totalHours / totalGames).toFixed(1) : 0}h`,
    `${avgScore} / 10`,
    `${totalPlatinas} platinas`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Ano', 'Jogos Zerados', 'Horas Totais', 'Média Horas', 'Nota Média', '100% / Platinas']],
    body: yearBody,
    theme: 'grid',
    headStyles: {
      fillColor: [109, 40, 217], // Purple 700
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: darkTextColor,
    },
    margin: { left: 40, right: 40 },
  });

  // 5. Page Break for Full Games List
  doc.addPage();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 595, 50, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('Lista Completa de Jogos Zerados', 40, 32);

  const gamesTableBody = games.map((g, i) => [
    (i + 1).toString(),
    g.title,
    g.platform,
    g.genre,
    g.completionCondition,
    `${g.rating.toFixed(1)}/10`,
    g.difficulty,
    `${g.hours}h`,
    new Date(g.completedDate + 'T12:00:00').toLocaleDateString('pt-BR'),
  ]);

  autoTable(doc, {
    startY: 65,
    head: [['#', 'Título', 'Plataforma', 'Gênero', 'Condição', 'Nota', 'Dificuldade', 'Tempo', 'Data']],
    body: gamesTableBody,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: darkTextColor,
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 95 },
      2: { cellWidth: 70 },
      3: { cellWidth: 65 },
      4: { cellWidth: 80 },
      5: { cellWidth: 40 },
      6: { cellWidth: 55 },
      7: { cellWidth: 40 },
      8: { cellWidth: 50 },
    },
    margin: { left: 40, right: 40 },
  });

  // Add footer to all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(
      `GameVault - Diário de Jogos Zerados • Página ${i} de ${pageCount}`,
      40,
      820
    );
    doc.text(
      'Documento gerado em conformidade com o diário gamer pessoal',
      555,
      820,
      { align: 'right' }
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  doc.save(`GameVault_Resumo_Jogos_Zerados_${todayStr}.pdf`);
}
