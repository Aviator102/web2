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

  if (!url) {
    return res.status(400).send('Erro: Nenhuma URL fornecida.');
  }

  // Garantir que a URL está corretamente formatada
  let validUrl = url;
  if (!/^https?:\/\//i.test(url)) {
    validUrl = 'https://' + url; // Adiciona https:// se não tiver
  }

  try {
    console.log(`[INFO] Solicitando a URL: ${validUrl}`);

    // Verifique se o URL é acessível do servidor
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
      console.log('[PROXY ERROR] Resposta HTTP de erro:', error.response.status);
      return res.status(500).send(`Erro HTTP ao acessar o site: ${error.response.status} - ${error.response.statusText}`);
    } else {
      console.log('[PROXY ERROR] Erro desconhecido:', error.message);
      return res.status(500).send(`Erro desconhecido ao acessar o site: ${error.message}`);
    }
  }
};
