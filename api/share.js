const fs = require('fs');
const path = require('path');

function loadProperties() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'properties.json');
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading local properties.json:', err);
  }
  return null;
}

function loadIndexHtml() {
  try {
    const filePath = path.join(process.cwd(), 'index.html');
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
  } catch (err) {
    console.error('Error reading local index.html:', err);
  }
  return null;
}

module.exports = async (req, res) => {
  const propId = req.query.prop || req.query.id;
  
  let properties = loadProperties();
  if (!properties || properties.length === 0) {
    try {
      const resp = await fetch('https://raw.githubusercontent.com/devoraf258admi-create/inmobiliaria-devora-fernandez/main/data/properties.json');
      properties = await resp.json();
    } catch (e) {
      console.error('Fetch properties fallback failed:', e);
    }
  }

  let indexHtml = loadIndexHtml();
  if (!indexHtml) {
    try {
      const resp = await fetch('https://raw.githubusercontent.com/devoraf258admi-create/inmobiliaria-devora-fernandez/main/index.html');
      indexHtml = await resp.text();
    } catch (e) {
      console.error('Fetch index.html fallback failed:', e);
    }
  }

  if (!indexHtml) {
    return res.status(500).send('Error loading page');
  }

  // If no property ID requested or properties not loaded, return standard index.html
  if (!propId || !properties) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(indexHtml);
  }

  const prop = properties.find(p => String(p.id) === String(propId) || String(p.code).toLowerCase() === String(propId).toLowerCase());

  if (!prop) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(indexHtml);
  }

  // Determine property image URL for Open Graph
  let ogImage = '';
  if (prop.image) {
    if (prop.image.startsWith('http')) {
      // If KiteProp large image, use the /md/ version (under 300KB) so WhatsApp accepts it reliably
      ogImage = prop.image.includes('/lg/') ? prop.image.replace('/lg/', '/md/') : prop.image;
    } else if (prop.image.startsWith('data:image')) {
      ogImage = `https://www.inmobiliariadevorafernandez.com.ar/api/prop-image?id=${prop.id}`;
    }
  }
  if (!ogImage && Array.isArray(prop.gallery) && prop.gallery.length > 0) {
    const first = prop.gallery[0];
    if (first.startsWith('http')) {
      ogImage = first.includes('/lg/') ? first.replace('/lg/', '/md/') : first;
    } else if (first.startsWith('data:image')) {
      ogImage = `https://www.inmobiliariadevorafernandez.com.ar/api/prop-image?id=${prop.id}&img=0`;
    }
  }
  if (!ogImage) {
    ogImage = 'https://www.inmobiliariadevorafernandez.com.ar/assets/img/whatsapp-preview-v3.jpg?v=9';
  }

  // Clean title & description
  const cleanTitle = `${prop.title} | Dévora Fernández Propiedades`;
  const priceInfo = prop.priceDisplay ? ` - ${prop.priceDisplay}` : '';
  const opInfo = prop.operation ? `${prop.operation}` : 'Propiedad';
  const locInfo = prop.location ? ` en ${prop.location}` : '';
  const descSnippet = (prop.description || '')
    .replace(/[#*`_~]/g, '')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);

  const cleanDescription = `${opInfo}${locInfo}${priceInfo}. ${descSnippet}`;
  const pageUrl = `https://www.inmobiliariadevorafernandez.com.ar/propiedad?id=${prop.id}`;

  // Helper function to safely escape HTML attributes
  const escapeAttr = (str) => String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  let modifiedHtml = indexHtml;

  // Replace <title>
  modifiedHtml = modifiedHtml.replace(/<title>.*?<\/title>/i, `<title>${escapeAttr(cleanTitle)}</title>`);

  // Replace meta description
  modifiedHtml = modifiedHtml.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/i, `<meta name="description" content="${escapeAttr(cleanDescription)}">`);

  // Replace og:title
  modifiedHtml = modifiedHtml.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/i, `<meta property="og:title" content="${escapeAttr(cleanTitle)}">`);

  // Replace og:description
  modifiedHtml = modifiedHtml.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/i, `<meta property="og:description" content="${escapeAttr(cleanDescription)}">`);

  // Replace og:url
  modifiedHtml = modifiedHtml.replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/i, `<meta property="og:url" content="${escapeAttr(pageUrl)}">`);

  // Replace og:image & og:image:secure_url
  modifiedHtml = modifiedHtml.replace(/<meta\s+property="og:image"\s+content=".*?"\s*\/?>/i, `<meta property="og:image" content="${escapeAttr(ogImage)}">`);
  modifiedHtml = modifiedHtml.replace(/<meta\s+property="og:image:secure_url"\s+content=".*?"\s*\/?>/i, `<meta property="og:image:secure_url" content="${escapeAttr(ogImage)}">`);
  modifiedHtml = modifiedHtml.replace(/<meta\s+property="og:image:alt"\s+content=".*?"\s*\/?>/i, `<meta property="og:image:alt" content="${escapeAttr(cleanTitle)}">`);

  // Replace link rel="image_src"
  modifiedHtml = modifiedHtml.replace(/<link\s+rel="image_src"\s+href=".*?"\s*\/?>/i, `<link rel="image_src" href="${escapeAttr(ogImage)}">`);

  // Replace twitter:title, twitter:description, twitter:image
  modifiedHtml = modifiedHtml.replace(/<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:title" content="${escapeAttr(cleanTitle)}">`);
  modifiedHtml = modifiedHtml.replace(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:description" content="${escapeAttr(cleanDescription)}">`);
  modifiedHtml = modifiedHtml.replace(/<meta\s+name="twitter:image"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:image" content="${escapeAttr(ogImage)}">`);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
  return res.status(200).send(modifiedHtml);
};
