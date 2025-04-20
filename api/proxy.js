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

  try {
    const response = await axios.get(url);
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
    res.status(500).send('Erro ao carregar o site.');
  }
};
