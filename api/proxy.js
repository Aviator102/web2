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

  // Verificar se a URL foi passada corretamente
  if (!url) {
    return res.status(400).send('Erro: Nenhuma URL fornecida.');
  }

  // Garantir que a URL está corretamente formatada (com http:// ou https://)
  let validUrl = url;
  if (!/^https?:\/\//i.test(url)) {
    validUrl = 'https://' + url; // Se não tiver http ou https, adiciona https://
  }

  try {
    console.log(`[INFO] Solicitando a URL: ${validUrl}`);
    
    // ⬇️ Adicionando User-Agent "real"
    const response = await axios.get(validUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Safari/537.36'
      }
    });

    console.log(`[INFO] Resposta recebida para a URL: ${validUrl}`);
    
    const html = response.data;
    const $ = cheerio.load(html);

    // Reescreve links para passar pelo seu proxy
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        const absoluteHref = rewriteUrl(href, validUrl);
        $(el).attr('href', `/proxy-navigate.html?url=${encodeURIComponent(absoluteHref)}`);
        $(el).attr('target', '_parent');
      }
    });

    // Corrige caminhos de imagens, CSS e JS
    $('img').each((i, el) => {
      const src = $(el).attr('src');
      if (src) $(el).attr('src', rewriteUrl(src, validUrl));
    });

    $('link').each((i, el) => {
      const href = $(el).attr('href');
      if (href) $(el).attr('href', rewriteUrl(href, validUrl));
    });

    $('script').each((i, el) => {
      const src = $(el).attr('src');
      if (src) $(el).attr('src', rewriteUrl(src, validUrl));
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
