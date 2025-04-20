const axios = require('axios');
const cheerio = require('cheerio');

// Função para reescrever URLs relativas para absolutas
const rewriteUrl = (url, base) => {
  const parsedUrl = new URL(url, base);
  return parsedUrl.href;
};

module.exports = async (req, res) => {
  const { url } = req.query;
  
  if (!url || !url.startsWith('http')) {
    return res.status(400).send('URL inválida.');
  }

  try {
    // Obter o HTML da URL fornecida
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    // Reescrever os links de recursos (imagens, CSS, JS)
    $('img').each((i, el) => {
      const src = $(el).attr('src');
      if (src && !src.startsWith('http')) {
        $(el).attr('src', rewriteUrl(src, url));
      }
    });

    $('link').each((i, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('http')) {
        $(el).attr('href', rewriteUrl(href, url));
      }
    });

    $('script').each((i, el) => {
      const src = $(el).attr('src');
      if (src && !src.startsWith('http')) {
        $(el).attr('src', rewriteUrl(src, url));
      }
    });

    // Enviar o HTML modificado para o navegador
    res.send($.html());
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao acessar o conteúdo da URL.');
  }
};
