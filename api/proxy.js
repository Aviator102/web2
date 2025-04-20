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
    return res.status(400).send('URL inválida.');
  }

  // Definindo o User-Agent para simular o Chrome
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36';
  
  try {
    console.log(`Tentando acessar a URL: ${url}`);

    const response = await axios.get(url, {
      headers: {
        'User-Agent': userAgent, // Simulando o Chrome
      }
    });

    console.log(`Resposta recebida com status: ${response.status}`);

    const html = response.data;
    const $ = cheerio.load(html);

    // Reescreve links <a> para passar pelo proxy
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        const absoluteHref = rewriteUrl(href, url);
        $(el).attr('href', `/proxy-navigate.html?url=${encodeURIComponent(absoluteHref)}`);
        $(el).attr('target', '_parent'); // Abre no iframe pai
      }
    });

    // Reescreve imagens, scripts, css
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
    console.error('Erro ao carregar o site:', error.message);

    // Verifique se o erro é um erro de resposta HTTP
    if (error.response) {
      console.error(`Resposta do servidor: ${error.response.status} ${error.response.statusText}`);
      return res.status(500).send(`Erro ao carregar o site: ${error.response.status} - ${error.response.statusText}`);
    }

    // Erro geral
    console.error('Erro geral:', error);
    res.status(500).send('Erro desconhecido ao carregar o site.');
  }
};
