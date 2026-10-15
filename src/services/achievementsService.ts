import type { GameAchievement, TrophyType } from '../types.ts';
import { GoogleGenAI, Type } from '@google/genai';

// Curated high-fidelity official/canonical achievements for top played games
export const POPULAR_GAMES_ACHIEVEMENTS: Record<string, Array<Omit<GameAchievement, 'unlocked' | 'unlockedAt'>>> = {
  'elden ring': [
    { id: 'er_plat', title: 'O Anel Prístino', description: 'Obteve todas as outras conquistas e tornou-se o Lorde Prístino.', type: 'platinum' },
    { id: 'er_1', title: 'Lorde Prístino', description: 'Chegou ao final da história tornando-se o Lorde Prístino.', type: 'gold' },
    { id: 'er_2', title: 'Era das Estrelas', description: 'Chegou ao final secreto guiado pela Bruxa Ranni.', type: 'gold' },
    { id: 'er_3', title: 'Senhor da Chama Frenética', description: 'Abraçou a Chama Frenética e incinerou a Ordem Áurea.', type: 'gold' },
    { id: 'er_4', title: 'Malenia, a Deusa da Podridão', description: 'Derrotou a Semideusa Malenia em Elphael.', type: 'silver' },
    { id: 'er_5', title: 'Radahn, o Flagelo Estelar', description: 'Triunfou no festival de combate no Castelo Juba Rubra.', type: 'silver' },
    { id: 'er_6', title: 'Mohg, o Senhor do Sangue', description: 'Derrotou o Lorde do Sangue no Palácio de Mohgwyn.', type: 'silver' },
    { id: 'er_7', title: 'Maliketh, a Lâmina Negra', description: 'Derrotou a Morte Destinada em Farum Azula Despedaçada.', type: 'silver' },
    { id: 'er_8', title: 'Godfrey, o Primeiro Lorde Prístino', description: 'Venceu o guerreiro Hoarah Loux em Leyndell.', type: 'silver' },
    { id: 'er_9', title: 'Margit, o Agouro Caído', description: 'Superou o temível guardião nos portões do Castelo Tempesvéu.', type: 'bronze' },
    { id: 'er_10', title: 'Godrick, o Enxertado', description: 'Derrotou o governante do Castelo Tempesvéu.', type: 'bronze' },
    { id: 'er_11', title: 'Rennala, Rainha da Lua Cheia', description: 'Superou a Grã-Bibliotecária na Academia de Raya Lucaria.', type: 'bronze' },
    { id: 'er_12', title: 'Cinzas Lendárias', description: 'Adquiriu todos os espíritos lendários para invocação.', type: 'silver' },
    { id: 'er_13', title: 'Armamentos Lendários', description: 'Coletou todas as armas lendárias das Terras Intermédias.', type: 'gold' },
    { id: 'er_14', title: 'Mesa-Redonda', description: 'Chegou ao refúgio sagrado do Castelo da Távola Redonda.', type: 'bronze' },
    { id: 'er_15', title: 'Grande Runa Restaurada', description: 'Despertou o poder adormecido de uma Grande Runa em uma Torre Divina.', type: 'bronze' },
  ],
  'the witcher 3: wild hunt': [
    { id: 'tw3_plat', title: 'O Limite do Possível', description: 'Conquistou todos os troféus e tornou-se a lenda de Rívia.', type: 'platinum' },
    { id: 'tw3_1', title: 'O Conquistador de Mundos', description: 'Concluiu o jogo na dificuldade Marcha da Morte.', type: 'gold' },
    { id: 'tw3_2', title: 'Encontrou Yennefer', description: 'Reencontrou a feiticeira de Vengerberg após anos de busca.', type: 'bronze' },
    { id: 'tw3_3', title: 'Amigo de Família', description: 'Completou a complexa trama com o Barão Sanguinário em Velen.', type: 'silver' },
    { id: 'tw3_4', title: 'Algo Começa, Algo Termina', description: 'Concluiu a história principal de Geralt e Ciri.', type: 'gold' },
    { id: 'tw3_5', title: 'Geralt, o Cavaleiro', description: 'Venceu o grande torneio de cartas Gwent em Novigrad.', type: 'silver' },
    { id: 'tw3_6', title: 'Mestre Armeiro', description: 'Forjou um conjunto completo de equipamento Grão-Mestre de Bruxo.', type: 'silver' },
    { id: 'tw3_7', title: 'Caçador de Monstros', description: 'Completou todos os contratos de bruxo das vilas e cidades.', type: 'gold' },
    { id: 'tw3_8', title: 'Mutante Excepcional', description: 'Desbloqueou e equipou uma mutação avançada.', type: 'bronze' },
    { id: 'tw3_9', title: 'Bravura em Skellige', description: 'Ajudou a coroar o novo líder de Skellige.', type: 'silver' },
    { id: 'tw3_10', title: 'Colecionador de Gwent', description: 'Adquiriu todas as cartas do jogo básico de Gwent.', type: 'silver' },
    { id: 'tw3_11', title: 'Derrubada no Vazio', description: 'Elimine 10 inimigos arremessando-os de penhascos com Aard.', type: 'bronze' },
    { id: 'tw3_12', title: 'Amor no Ar', description: 'Vivenciou um romance épico com Triss Merigold ou Yennefer.', type: 'bronze' },
  ],
  'god of war ragnarok': [
    { id: 'gowr_plat', title: 'O Urso e o Lobo', description: 'Colete todos os troféus da saga nórdica.', type: 'platinum' },
    { id: 'gowr_1', title: 'Ragnarök', description: 'Enfrente o Deus de Todos e conclua a jornada épica.', type: 'gold' },
    { id: 'gowr_2', title: 'Funeral de um Amigo', description: 'Participe da comovente despedida a um grande aliado.', type: 'silver' },
    { id: 'gowr_3', title: 'Tumba dos Berserkers', description: 'Derrote o Rei Hrólf Kraki e seus campeões.', type: 'gold' },
    { id: 'gowr_4', title: 'A Rainha Gná', description: 'Derrote a nova Rainha das Valquírias em Muspelheim.', type: 'gold' },
    { id: 'gowr_5', title: 'Árvore da Vida', description: 'Colete todas as maçãs de Iðunn e Chifres de Hidromel.', type: 'silver' },
    { id: 'gowr_6', title: 'Lança Draupnir', description: 'Obtenha a lendária arma forjada pela Senhora da Forja.', type: 'bronze' },
    { id: 'gowr_7', title: 'Mestre da Forja', description: 'Melhore um conjunto de armadura até o nível 9.', type: 'silver' },
    { id: 'gowr_8', title: 'Libertação das Baleias', description: 'Liberte as criaturas marinhas lendárias em Svartalfheim.', type: 'bronze' },
    { id: 'gowr_9', title: 'Cura dos Reinos', description: 'Feche todas as fendas dimensionais entre os 9 Reinos.', type: 'silver' },
  ],
  'god of war': [
    { id: 'gow_plat', title: 'Pai e Filho', description: 'Obtenha todos os outros troféus.', type: 'platinum' },
    { id: 'gow_1', title: 'Último Desejo', description: 'Espalhe as cinzas no pico mais alto de todos os reinos.', type: 'gold' },
    { id: 'gow_2', title: 'Julgadora dos Caídos', description: 'Derrote Sigrun, a temível Rainha das Valquírias.', type: 'gold' },
    { id: 'gow_3', title: 'Lâminas do Caos Despertadas', description: 'Recupere suas antigas lâminas do passado sangrento.', type: 'bronze' },
    { id: 'gow_4', title: 'Mundo Submerso', description: 'Explore todas as áreas ocultas do Lago dos Nove.', type: 'silver' },
    { id: 'gow_5', title: 'Tesouro dos Anões', description: 'Forje as armaduras de Brok e Sindri.', type: 'bronze' },
    { id: 'gow_6', title: 'Caçador de Corvos de Odin', description: 'Elimine todos os 51 corvos espectrais de Odin.', type: 'silver' },
    { id: 'gow_7', title: 'Escuridão e Névoa', description: 'Recupere todos os tesouros do labirinto de Niflheim.', type: 'gold' },
    { id: 'gow_8', title: 'Fogo e Enxofre', description: 'Conclua todos os desafios nos picos de Muspelheim.', type: 'gold' },
  ],
  'the last of us part i': [
    { id: 'tlou_plat', title: 'Não Pode Ser Por Acaso', description: 'Colete todos os outros troféus do jogo.', type: 'platinum' },
    { id: 'tlou_1', title: 'Sobrevivente Nato', description: 'Conclua a história na dificuldade Sobrevivente ou Punitivo.', type: 'gold' },
    { id: 'tlou_2', title: 'O Que Passamos Juntos', description: 'Complete a emocionante travessia com Ellie.', type: 'silver' },
    { id: 'tlou_3', title: 'Procure a Luz', description: 'Encontre todos os pingentes dos Vaga-Lumes.', type: 'silver' },
    { id: 'tlou_4', title: 'Em Suas Melhores Condições', description: 'Aprimore completamente todas as armas de Joel.', type: 'silver' },
    { id: 'tlou_5', title: 'Conhecendo Ellie', description: 'Ouça todas as piadas do livro de Ellie.', type: 'bronze' },
    { id: 'tlou_6', title: 'Arrombador de Portas', description: 'Abra todas as portas trancadas com facas artesanais.', type: 'bronze' },
    { id: 'tlou_7', title: 'Mestre da Furtividade', description: 'Passe por um grupo de estaladores sem ser detectado.', type: 'bronze' },
  ],
  'red dead redemption 2': [
    { id: 'rdr2_plat', title: 'Lenda do Oeste', description: 'Conquiste todos os troféus da saga de Arthur Morgan.', type: 'platinum' },
    { id: 'rdr2_1', title: 'Redenção', description: 'Complete o capítulo final e a jornada de Arthur.', type: 'gold' },
    { id: 'rdr2_2', title: 'O Melhor do Oeste', description: 'Atinja 100% de conclusão de todo o mapa e compêndio.', type: 'gold' },
    { id: 'rdr2_3', title: 'Amigo de Confiança', description: 'Alcance o nível máximo de honra positiva.', type: 'silver' },
    { id: 'rdr2_4', title: 'Colecionador de Espécies', description: 'Estude todos os animais silvestres do compêndio.', type: 'silver' },
    { id: 'rdr2_5', title: 'Cavalo Leal', description: 'Atinja o vínculo de nível 4 com a sua montaria.', type: 'bronze' },
    { id: 'rdr2_6', title: 'Febre do Ouro', description: 'Obtenha 70 medalhas de ouro nas missões de história.', type: 'gold' },
    { id: 'rdr2_7', title: 'Pistoleiro Implacável', description: 'Derrote todos os lendários pistoleiros do Velho Oeste.', type: 'bronze' },
  ],
  'hollow knight': [
    { id: 'hk_plat', title: 'Coração de Hallownest', description: 'Adquira todos os outros troféus e liberte o reino.', type: 'platinum' },
    { id: 'hk_1', title: 'O Cavaleiro Vazio', description: 'Derrote o Hollow Knight e assuma o fardo.', type: 'silver' },
    { id: 'hk_2', title: 'Não Mais Sonhos', description: 'Derrote a Radiância e traga o vazio absoluto.', type: 'gold' },
    { id: 'hk_3', title: 'Completismo Puro', description: 'Atinja 112% de conclusão do jogo.', type: 'gold' },
    { id: 'hk_4', title: 'Alma de Aço', description: 'Conclua o jogo no modo Alma de Aço sem morrer nenhuma vez.', type: 'gold' },
    { id: 'hk_5', title: 'Mestre dos Amuletos', description: 'Adquira todos os amuletos e receba a bênção de Salubra.', type: 'silver' },
    { id: 'hk_6', title: 'Ferrão Puro', description: 'Forje o ferrão final na oficina do Ferreiro de Ferrões.', type: 'silver' },
    { id: 'hk_7', title: 'Metamorfose', description: 'Resgate todos os 46 larvas aprisionadas pelo reino.', type: 'silver' },
    { id: 'hk_8', title: 'Panteão de Hallownest', description: 'Supere o quinto panteão no Lar dos Deuses.', type: 'gold' },
  ],
  'bloodborne': [
    { id: 'bb_plat', title: 'Bloodborne', description: 'Todos os troféus adquiridos. Um caçador deve caçar.', type: 'platinum' },
    { id: 'bb_1', title: 'Amanhecer de Yharnam', description: 'Você sobreviveu à caçada e viu um novo dia nascer.', type: 'gold' },
    { id: 'bb_2', title: 'Cumprindo Desejos', description: 'Cativado pela presença da lua, prometa vigiar o Sonho.', type: 'gold' },
    { id: 'bb_3', title: 'Infância do Começo', description: 'Você ascendeu e se tornou um Grande bebê.', type: 'gold' },
    { id: 'bb_4', title: 'Yharnam, Rainha Pthumeriana', description: 'Derrotou Yharnam no labirinto dos cálices sagrados.', type: 'gold' },
    { id: 'bb_5', title: 'Mestre Caçador de Armas', description: 'Adquiriu todas as armas de truque dos caçadores.', type: 'silver' },
    { id: 'bb_6', title: 'Padre Gascoigne', description: 'Derrotou a fera em que se transformou o outrora nobre padre.', type: 'bronze' },
    { id: 'bb_7', title: 'Vigário Amélia', description: 'Derrotou a vigária na Grande Catedral.', type: 'bronze' },
    { id: 'bb_8', title: 'Rom, a Aranha Vacilante', description: 'Derrotou o Grande Rom nas águas do Lago da Lua.', type: 'bronze' },
  ],
  'cyberpunk 2077': [
    { id: 'cp_plat', title: 'Nunca Desista', description: 'Conquiste todos os troféus de Night City.', type: 'platinum' },
    { id: 'cp_1', title: 'O Mundo', description: 'Complete a história principal em busca da cura.', type: 'gold' },
    { id: 'cp_2', title: 'Lenda de Afterlife', description: 'Atinja o nível máximo de reputação nas ruas.', type: 'silver' },
    { id: 'cp_3', title: 'Bua Amizade', description: 'Conclua a linha de missões de Johnny Silverhand.', type: 'silver' },
    { id: 'cp_4', title: 'Tenho o Carro', description: 'Compre todos os veículos disponíveis para compra.', type: 'gold' },
    { id: 'cp_5', title: 'Ciborgue Completo', description: 'Instale pelo menos um implante em cada parte do corpo.', type: 'bronze' },
    { id: 'cp_6', title: 'Cidade das Sombras', description: 'Complete todas as atividades e serviços em Watson.', type: 'silver' },
  ],
  'super mario odyssey': [
    { id: 'smo_1', title: 'Casamento Interrompido', description: 'Conclua a história principal derrotando Bowser na Lua.', type: 'gold' },
    { id: 'smo_2', title: 'Lado Escuro da Lua', description: 'Vença os chefes Broodals na gravidade reduzida.', type: 'silver' },
    { id: 'smo_3', title: 'Lado Mais Escuro da Lua', description: 'Supere o desafio de plataforma supremo sem checkpoints.', type: 'platinum' },
    { id: 'smo_4', title: 'Colecionador de Luas (500 Luas)', description: 'Recupere energia suficiente para alcançar novos mundos.', type: 'gold' },
    { id: 'smo_5', title: 'Guarda-Roupa Completo', description: 'Compre todas as roupas e chapéus na loja Crazy Cap.', type: 'silver' },
    { id: 'smo_6', title: 'Mestre da Captura', description: 'Capture todas as 52 criaturas e objetos com Cappy.', type: 'silver' },
    { id: 'smo_7', title: 'Festival de New Donk City', description: 'Celebre o lendário show com a prefeita Pauline.', type: 'bronze' },
  ],
  'the legend of zelda: tears of the kingdom': [
    { id: 'totk_1', title: 'Herói de Hyrule Restaurado', description: 'Derrote Ganondorf nas profundezas e salve a Princesa Zelda.', type: 'platinum' },
    { id: 'totk_2', title: 'Quatro Sábios Unidos', description: 'Desperte o poder dos quatro sábios ancestrais dos templos.', type: 'gold' },
    { id: 'totk_3', title: 'A Master Sword Renascida', description: 'Recupere a lendária espada que banha as trevas nos céus.', type: 'gold' },
    { id: 'totk_4', title: 'Mapeador dos Céus e Profundezas', description: 'Ative todas as raízes de luz do Subsolo e torres do Céu.', type: 'silver' },
    { id: 'totk_5', title: 'Engenheiro Zonai Supremo', description: 'Crie uma máquina automotriz lendária usando Ultrahand.', type: 'bronze' },
    { id: 'totk_6', title: 'Mestre dos Santuários (152 Santuários)', description: 'Conclua todos os quebra-cabeças de santuários de Rauru.', type: 'gold' },
    { id: 'totk_7', title: 'Todas as Lágrimas do Dragão', description: 'Descubra a verdade sobre o passado esquecido de Hyrule.', type: 'silver' },
  ]
};

// Generate high quality achievements for any game via Gemini or canonical generator
export async function getGameAchievements(
  title: string,
  platform?: string,
  ai?: GoogleGenAI | null
): Promise<GameAchievement[]> {
  const cleanTitle = title.trim().toLowerCase();

  // 1. Check curated list
  for (const [key, list] of Object.entries(POPULAR_GAMES_ACHIEVEMENTS)) {
    if (cleanTitle === key || cleanTitle.includes(key) || key.includes(cleanTitle)) {
      return list.map((a, i) => ({
        ...a,
        id: a.id || `curated_${i}`,
        unlocked: false,
      }));
    }
  }

  // 2. Try RAWG API if key is available in environment
  const rawgKey = process.env.RAWG_API_KEY;
  if (rawgKey) {
    try {
      const searchRes = await fetch(
        `https://api.rawg.io/api/games?search=${encodeURIComponent(title)}&key=${rawgKey}&page_size=1`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.results && searchData.results.length > 0) {
          const gameId = searchData.results[0].id;
          const achRes = await fetch(
            `https://api.rawg.io/api/games/${gameId}/achievements?key=${rawgKey}&page_size=40`,
            { signal: AbortSignal.timeout(4000) }
          );
          if (achRes.ok) {
            const achData = await achRes.json();
            if (Array.isArray(achData.results) && achData.results.length > 0) {
              return achData.results.map((item: any, idx: number) => {
                const pct = parseFloat(item.percent) || 20;
                let type: TrophyType = 'bronze';
                if (idx === 0) type = 'platinum';
                else if (pct < 10) type = 'gold';
                else if (pct < 30) type = 'silver';
                return {
                  id: `rawg_${item.id || idx}`,
                  title: item.name || `Conquista ${idx + 1}`,
                  description: item.description || 'Conquista oficial registrada na comunidade.',
                  type,
                  unlocked: false,
                };
              });
            }
          }
        }
      }
    } catch (rawgErr) {
      console.warn('[Achievements] RAWG fetch timed out or failed:', rawgErr);
    }
  }

  // 3. Try Gemini AI
  if (ai) {
    try {
      const prompt = `Você é um banco de dados de conquistas e troféus de videogame.
Para o jogo "${title}" (${platform ? `Plataforma: ${platform}` : 'Multiplataforma'}), gere a lista realista de troféus/conquistas oficiais ou canônicas em Português do Brasil.
Gere entre 15 e 25 conquistas.
Distribuição recomendada:
- Exatamente 1 de tipo 'platinum' (troféu de platina por concluir tudo)
- 3 a 5 de tipo 'gold' (desafios épicos, zerar o jogo, 100%)
- 6 a 8 de tipo 'silver' (colecionáveis, chefes principais, missões secretas)
- 8 a 12 de tipo 'bronze' (progressão inicial, habilidades, exploração)

Retorne estritamente um JSON no formato:
{
  "achievements": [
    {
      "title": "Nome do Troféu",
      "description": "Descrição clara do que fazer para conquistar",
      "type": "platinum" | "gold" | "silver" | "bronze" | "special"
    }
  ]
}`;

      const res = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              achievements: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    type: { 
                      type: Type.STRING,
                      enum: ['platinum', 'gold', 'silver', 'bronze', 'special']
                    },
                  },
                  required: ['title', 'description', 'type'],
                },
              },
            },
            required: ['achievements'],
          },
        },
      });

      const parsed = JSON.parse(res.text || '{}');
      if (Array.isArray(parsed.achievements) && parsed.achievements.length > 0) {
        return parsed.achievements.map((a: any, i: number) => ({
          id: `ai_${i}_${Math.random().toString(36).substring(2, 6)}`,
          title: a.title,
          description: a.description,
          type: a.type as TrophyType,
          unlocked: false,
        }));
      }
    } catch (err) {
      console.warn('[Achievements] Gemini generation failed:', err);
    }
  }

  // 4. Intelligent canonical fallback template
  return [
    {
      id: `gen_plat_${Date.now()}`,
      title: `${title}: Mestre Absoluto`,
      description: `Complete todos os desafios, histórias e objetivos em ${title}.`,
      type: 'platinum',
      unlocked: false,
    },
    {
      id: `gen_gold_1`,
      title: 'Fim da Jornada',
      description: 'Conclua a campanha principal e assista aos créditos.',
      type: 'gold',
      unlocked: false,
    },
    {
      id: `gen_gold_2`,
      title: 'Perfeccionista (100%)',
      description: 'Encontre todos os segredos e atinja a pontuação máxima.',
      type: 'gold',
      unlocked: false,
    },
    {
      id: `gen_silver_1`,
      title: 'Veterano das Batalhas',
      description: 'Derrote o chefe supremo ou complete a prova mais desafiadora.',
      type: 'silver',
      unlocked: false,
    },
    {
      id: `gen_silver_2`,
      title: 'Grande Explorador',
      description: 'Descubra todas as regiões do mapa ou fases secretas.',
      type: 'silver',
      unlocked: false,
    },
    {
      id: `gen_silver_3`,
      title: 'Arsenal Completo',
      description: 'Desbloqueie todas as habilidades, armas e equipamentos lendários.',
      type: 'silver',
      unlocked: false,
    },
    {
      id: `gen_bronze_1`,
      title: 'Primeiros Passos',
      description: 'Complete o prólogo ou tutorial inicial.',
      type: 'bronze',
      unlocked: false,
    },
    {
      id: `gen_bronze_2`,
      title: 'Sobrevivente Iniciante',
      description: 'Vença o primeiro grande confronto de história.',
      type: 'bronze',
      unlocked: false,
    },
    {
      id: `gen_bronze_3`,
      title: 'Colecionador Curioso',
      description: 'Encontre 10 itens colecionáveis espalhados pelo mundo.',
      type: 'bronze',
      unlocked: false,
    },
    {
      id: `gen_bronze_4`,
      title: 'Aprimoramento',
      description: 'Realize seu primeiro upgrade de equipamento ou personagem.',
      type: 'bronze',
      unlocked: false,
    },
    {
      id: `gen_bronze_5`,
      title: 'Dedicação Incansável',
      description: 'Jogue por mais de 10 horas registradas.',
      type: 'bronze',
      unlocked: false,
    },
  ];
}
