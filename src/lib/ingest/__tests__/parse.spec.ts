import { describe, expect, it } from 'vitest'
import { parseFeed, stripHtml } from '../rss'
import { cleanTitle, resolveSourceId, stableId } from '../normalize'
import { classifyTheme } from '../theme'
import { estimateTone } from '../tone'
import { makeSources } from './helpers'

const RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Canal</title>
    <item>
      <title><![CDATA[Governo anuncia pacote de ajuda a municípios]]></title>
      <link>https://exemplo.com.br/noticia/1?utm_source=rss</link>
      <description><![CDATA[<p>O governo anunciou &amp; detalhou o pacote nesta quinta.</p>]]></description>
      <pubDate>Thu, 22 Oct 2026 10:00:00 GMT</pubDate>
      <media:content url="https://exemplo.com.br/img.jpg" />
    </item>
    <item>
      <title>Sem link deve ser ignorado</title>
      <description>texto</description>
    </item>
  </channel>
</rss>`

const ATOM = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Feed</title>
  <entry>
    <title>STF julga recurso sobre marco temporal</title>
    <link rel="alternate" href="https://exemplo.com.br/politica/2" />
    <summary>O Supremo retomou o julgamento nesta quarta-feira.</summary>
    <published>2026-10-21T18:30:00Z</published>
  </entry>
</feed>`

const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://exemplo.com.br/cidade/3</loc>
    <news:publication_date>2026-10-22T09:15:00Z</news:publication_date>
    <news:title>Chuva forte alaga avenidas da capital</news:title>
    <image:image><image:loc>https://exemplo.com.br/foto.jpg</image:loc></image:image>
  </url>
</urlset>`

describe('parseFeed', () => {
  it('lê RSS, descarta itens sem link e extrai imagem e data', () => {
    const items = parseFeed(RSS, 'teste')
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      title: 'Governo anuncia pacote de ajuda a municípios',
      url: 'https://exemplo.com.br/noticia/1?utm_source=rss',
      image: 'https://exemplo.com.br/img.jpg',
      publishedAt: '2026-10-22T10:00:00.000Z',
    })
    expect(items[0]!.excerpt).toBe('O governo anunciou & detalhou o pacote nesta quinta.')
  })

  it('lê Atom usando href do link alternate', () => {
    const items = parseFeed(ATOM, 'teste')
    expect(items).toHaveLength(1)
    expect(items[0]!.url).toBe('https://exemplo.com.br/politica/2')
    expect(items[0]!.publishedAt).toBe('2026-10-21T18:30:00.000Z')
  })

  it('lê sitemap Google News com título, data e imagem', () => {
    const items = parseFeed(SITEMAP, 'teste')
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      title: 'Chuva forte alaga avenidas da capital',
      url: 'https://exemplo.com.br/cidade/3',
      image: 'https://exemplo.com.br/foto.jpg',
      publishedAt: '2026-10-22T09:15:00.000Z',
    })
  })

  it('resolve links relativos contra a URL base do feed', () => {
    const xml = `<rss version="2.0"><channel>
      <item><title>Prefeitura anuncia obras de drenagem na região central</title>
      <link>/cidade/2026/10/obra.html</link><pubDate>2026-10-22T10:00:00Z</pubDate></item>
    </channel></rss>`
    const items = parseFeed(xml, 'teste', 10, 'https://exemplo.com.br/feed/')
    expect(items[0]!.url).toBe('https://exemplo.com.br/cidade/2026/10/obra.html')
  })

  it('devolve vazio para conteúdo que não é feed', () => {
    expect(parseFeed('<html><body>bloqueado</body></html>', 'teste')).toHaveLength(0)
  })
})

describe('stripHtml', () => {
  it('remove HTML duplamente escapado', () => {
    expect(stripHtml('&lt;p&gt;Texto &amp;amp; mais&lt;/p&gt;')).toBe('Texto & mais')
  })

  it('remove cauda de "leia mais"', () => {
    expect(stripHtml('<p>Governo anuncia pacote.</p> Leia mais')).toBe('Governo anuncia pacote.')
  })
})

describe('cleanTitle', () => {
  it('remove prefixos e sufixos de veículo', () => {
    expect(cleanTitle('[Vídeo] Governo anuncia pacote | G1')).toBe('Governo anuncia pacote')
    expect(cleanTitle('Ao vivo: STF retoma julgamento')).toBe('STF retoma julgamento')
  })
})

describe('resolveSourceId', () => {
  const sources = makeSources(['folha', 'uol', 'g1'])

  it('prefere o domínio mais específico', () => {
    expect(resolveSourceId('https://www1.folha.uol.com.br/mercado/x', sources)).toBe('folha')
    expect(resolveSourceId('https://uol.com.br/economia/y', sources)).toBe('uol')
  })

  it('reconhece subdomínios', () => {
    expect(resolveSourceId('https://g1.globo.com/politica/z', sources)).toBe('g1')
  })

  it('devolve null para domínio desconhecido', () => {
    expect(resolveSourceId('https://exemplo.com.br/x', sources)).toBeNull()
  })
})

describe('classifyTheme', () => {
  it('não confunde palavras curtas dentro de outras palavras', () => {
    expect(classifyTheme('Daniel acompanha estreia do filho no kart')).not.toBe('Tecnologia')
    expect(classifyTheme('Fifa dará R$ 12 milhões para a Copa do Mundo feminina')).toBe('Esportes')
  })

  it('reconhece temas com sinal forte no título', () => {
    expect(classifyTheme('Palmeiras vence o Fluminense no Allianz Parque')).toBe('Esportes')
    expect(classifyTheme('TSE nega pedido e mantém cassação do candidato')).toBe('Eleições')
    expect(classifyTheme('Banco Central eleva a taxa Selic')).toBe('Economia')
  })
})

describe('estimateTone', () => {
  it('detecta apoio, crítica e neutralidade', () => {
    expect(estimateTone('Governo anuncia conquista histórica na educação').stance).toBe('support')
    expect(estimateTone('Escândalo de corrupção e fraude agrava crise').stance).toBe('critical')
    expect(estimateTone('Time empata sem gols em partida atrasada').stance).toBe('neutral')
  })
})

describe('stableId', () => {
  it('é determinístico e estável', () => {
    expect(stableId('https://exemplo.com/x')).toBe(stableId('https://exemplo.com/x'))
    expect(stableId('https://exemplo.com/x')).toMatch(/^[0-9a-f]{8}$/)
  })
})
