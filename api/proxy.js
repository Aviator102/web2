const axios = require('axios');
const cheerio = require('cheerio');

const rewriteUrl = (url, base) => {
  try {
    return new URL(url, base).href;
  } catch {
    return url;
  }
};

module.exports = async (req, res) => {
  const { url } = req.query;

  if (!url || !url.startsWith('http')) {
    return res.status(400).send('URL inválida. A URL precisa começar com "http" ou "https".');
  }

  try {
    console.log(`[INFO] Solicitando a URL: ${url}`);
    
    // ⬇️ Adicionando User-Agent "real"
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Safari/537.36'
      }
    });

    console.log(`[INFO] Resposta recebida para a URL: ${url}`);
    
    const html = response.data;
    const $ = cheerio.load(html);

    // Reescreve links para passar pelo seu proxy
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        const absoluteHref = rewriteUrl(href, url);
        $(el).attr('href', `/proxy-navigate.html?url=${encodeURIComponent(absoluteHref)}`);
        $(el).attr('target', '_parent');
      }
    });

    // Corrige caminhos de imagens, CSS e JS
    $('img').each((i, el) => {
      const src = $(el).attr('src');
      if (src) $(el).attr('src', rewriteUrl(src, url));
    });

    $('link').each((i, el) => {
      const href = $(el).attr('href');
      if (href) $(el).attr('href', rewriteUrl(href, url));
    });

    $('script').each((i, el) => {
      const src = $(el).attr('src');
      if (src) $(el).attr('src', rewriteUrl(src, url));
    });

    res.send($.html());
  } catch (error) {
    console.error('[PROXY ERROR] Erro ao carregar o site:', error.message);

    // Verifica se o erro foi causado por uma resposta HTTP não ok
    if (error.response) {
      res.status(500).send(`Erro HTTP ao acessar o site: ${error.response.status} - ${error.response.statusText}`);
    } else {
      res.status(500).send(`Erro desconhecido ao acessar o site: ${error.message}`);
    }
  }
};
