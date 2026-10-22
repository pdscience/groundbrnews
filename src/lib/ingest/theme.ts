import { fold } from './text'

interface ThemeRule {
  theme: string
  keywords: string[]
}

const RULES: ThemeRule[] = [
  {
    theme: 'Eleições',
    keywords: [
      'eleicao', 'eleicoes', 'eleitor', 'eleitores', 'urna', 'urnas', 'tse', 'voto', 'votos',
      'candidato', 'candidata', 'campanha', 'pesquisa datafolha', 'datafolha', 'quociente',
      'segundo turno', 'primeiro turno', 'pleito', 'coligacao', 'propaganda eleitoral',
    ],
  },
  {
    theme: 'Judiciário',
    keywords: [
      'stf', 'supremo', 'tribunal', 'juiz', 'juiza', 'desembargador', 'ministerio publico',
      'mpf', 'pgr', 'inquerito', 'denuncia', 'sentenca', 'julgamento', 'julgou', 'recurso',
      'habeas corpus', 'acao penal', 'justica', 'judiciario', 'stj', 'tcu', 'cnj', 'liminar',
      'mandado de seguranca', 'condenacao', 'condenado', 'absolvido',
    ],
  },
  {
    theme: 'Segurança',
    keywords: [
      'policia', 'policial', 'crime', 'criminal', 'homicidio', 'assassinato', 'assassinado',
      'roubo', 'furto', 'trafico', 'facção', 'faccao', 'milícia', 'pcc', 'cv',
      'operacao', 'prisao', 'preso', 'detido', 'tiroteio', 'violencia', 'feminicidio',
      'sequestro', 'golpe', 'fraude', 'corrupcao', 'lavagem de dinheiro',
    ],
  },
  {
    theme: 'Economia',
    keywords: [
      'economia', 'economico', 'pib', 'inflacao', 'ipca', 'juros', 'selic', 'copom', 'dolar',
      'ibovespa', 'bolsa', 'mercado', 'banco central', 'orcamento', 'fiscal', 'tributo',
      'imposto', 'receita', 'desemprego', 'emprego', 'salario', 'credito', 'investimento',
      'empresa', 'empresas', 'lucro', 'prejuizo', 'divida', 'reforma tributaria', 'tarifa',
      'petroleo', 'commodities', 'agronegocio', 'industria', 'comercio', 'bancos', 'banco',
      'varejo', 'arrecadacao', 'jornada de trabalho', 'escala 6x1', 'consumo',
      'bc', 'bradesco', 'itau', 'santander', 'caixa economica', 'reclamacoes', 'financas',
    ],
  },
  {
    theme: 'Saúde',
    keywords: [
      'saude', 'hospital', 'medico', 'medica', 'sus', 'doenca', 'vacina', 'vacinacao',
      'pandemia', 'epidemia', 'dengue', 'zika', 'gripe', 'cancer', 'ansiedade', 'depressao',
      'medicamento', 'remedio', 'anvisa', 'cirurgia', 'leito', 'uti', 'ministerio da saude',
      'obesidade', 'diabetes', 'hiv', 'aids',
    ],
  },
  {
    theme: 'Educação',
    keywords: [
      'educacao', 'escola', 'escolas', 'professor', 'professora', 'aluno', 'alunos',
      'universidade', 'universitario', 'enem', 'vestibular', 'mec', 'curso', 'ensino',
      'faculdade', 'bolsa', 'creche', 'alfabetizacao', 'pesquisa academica', 'capes', 'cnpq',
    ],
  },
  {
    theme: 'Clima',
    keywords: [
      'clima', 'climatico', 'aquecimento global', 'emissao', 'emissoes', 'carbono', 'cop',
      'desmatamento', 'queimada', 'queimadas', 'seca', 'estiagem', 'chuva', 'chuvas',
      'enchente', 'enchentes', 'alagamento', 'inundacao', 'ciclone', 'furacao', 'tornado',
      'temperatura', 'onda de calor', 'el nino', 'la nina', 'mudanca climatica',
    ],
  },
  {
    theme: 'Ambiente',
    keywords: [
      'ambiente', 'ambiental', 'meio ambiente', 'floresta', 'amazonia', 'ibama', 'icmbio',
      'biodiversidade', 'especie', 'animal', 'animais', 'poluicao', 'residuo', 'reciclagem',
      'saneamento', 'rio', 'igarape', 'pantanal', 'cerrado', 'mata atlantica', 'mineracao',
      'garimpo', 'pesca', 'oceanos', 'petroleo vazamento',
    ],
  },
  {
    theme: 'Tecnologia',
    keywords: [
      'tecnologia', 'inteligencia artificial', 'ia', 'algoritmo', 'software', 'aplicativo',
      'app', 'internet', 'rede social', 'redes sociais', 'plataforma', 'dados', 'privacidade',
      'ciberseguranca', 'hacker', 'ataque cibernetico', 'chip', 'smartphone', 'celular',
      'startup', 'robotica', 'satelite', '5g', 'openai', 'chatgpt', 'google', 'meta',
    ],
  },
  {
    theme: 'Cultura',
    keywords: [
      'cultura', 'musica', 'show', 'festival', 'cinema', 'filme', 'serie', 'teatro', 'livro',
      'literatura', 'arte', 'artista', 'exposicao', 'museu', 'novela', 'streaming', 'grammy',
      'oscar', 'bbb', 'famoso', 'celebridade', 'influencer', 'moda', 'prime video', 'netflix',
      'disney', 'temporada', 'novela',
    ],
  },
  {
    theme: 'Esportes',
    keywords: [
      'esporte', 'futebol', 'time', 'jogador', 'jogo', 'campeonato', 'brasileirao',
      'libertadores', 'copa', 'olimpiada', 'olimpiadas', 'atleta', 'gol', 'treinador',
      'flamengo', 'corinthians', 'palmeiras', 'sao paulo fc', 'vasco', 'botafogo',
      'cruzeiro', 'atletico', 'gremio', 'internacional', 'selecao', 'nba', 'f1', 'formula 1',
      'volei', 'tenis', 'surfe', 'mma', 'ufc',
    ],
  },
  {
    theme: 'Mobilidade',
    keywords: [
      'mobilidade', 'transito', 'transporte', 'onibus', 'metro', 'trem', 'brt', 'vlt',
      'rodovia', 'estrada', 'acidente', 'carro', 'veiculo', 'motocicleta', 'ciclovia',
      'passagem', 'tarifa', 'congestionamento', 'pedagio', 'aeroporto', 'voo', 'companhia aerea',
    ],
  },
  {
    theme: 'Internacional',
    keywords: [
      'internacional', 'exterior', 'eua', 'estados unidos', 'trump', 'biden', 'china',
      'russia', 'ucrania', 'israel', 'gaza', 'europa', 'uniao europeia', 'argentina',
      'venezuela', 'oni', 'onu', 'guerra', 'conflito', 'migrante', 'refugiado', 'embaixada',
      'itamaraty', 'mercosul', 'brics', 'otan',
    ],
  },
  {
    theme: 'Política',
    keywords: [
      'politica', 'governo', 'presidente', 'presidente da republica', 'congresso', 'senado',
      'camara', 'deputado', 'deputada', 'senador', 'senadora', 'ministro', 'ministra',
      'lula', 'bolsonaro', 'partido', 'oposicao', 'base aliada', 'reforma', 'pec', 'medida provisoria',
      'veto', 'sancao', 'planalto', 'stf', 'governador', 'prefeito', 'camara municipal',
    ],
  },
]

export const DEFAULT_THEME = 'Geral'

function containsKeyword(text: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(text)
}

export function classifyTheme(title: string, excerpt = ''): string {
  const titleFolded = fold(title)
  const bodyFolded = fold(excerpt)

  let bestTheme = DEFAULT_THEME
  let bestScore = 0

  for (const rule of RULES) {
    let score = 0
    for (const keyword of rule.keywords) {
      if (containsKeyword(titleFolded, keyword)) score += 3
      else if (containsKeyword(bodyFolded, keyword)) score += 1
    }
    if (score > bestScore) {
      bestScore = score
      bestTheme = rule.theme
    }
  }

  return bestTheme
}
