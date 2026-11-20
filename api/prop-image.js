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

module.exports = async (req, res) => {
  const propId = req.query.prop || req.query.id;
  const imgIndex = parseInt(req.query.img || '0', 10);

  if (!propId) {
    return res.status(400).send('Missing property ID');
  }

  let properties = loadProperties();
  if (!properties || properties.length === 0) {
    try {
      const resp = await fetch('https://raw.githubusercontent.com/devoraf258admi-create/inmobiliaria-devora-fernandez/main/data/properties.json');
      properties = await resp.json();
    } catch (e) {
      console.error('Fetch properties fallback failed:', e);
    }
  }

  if (!properties) {
    return res.status(500).send('Unable to load properties');
  }

  const prop = properties.find(p => String(p.id) === String(propId) || String(p.code).toLowerCase() === String(propId).toLowerCase());

  if (!prop) {
    return res.status(404).send('Property not found');
  }

  let targetImg = prop.image;
  if (Array.isArray(prop.gallery) && prop.gallery.length > imgIndex && imgIndex > 0) {
    targetImg = prop.gallery[imgIndex];
  } else if (!targetImg && Array.isArray(prop.gallery) && prop.gallery.length > 0) {
    targetImg = prop.gallery[0];
  }

  if (!targetImg) {
    return res.redirect(302, 'https://www.inmobiliariadevorafernandez.com.ar/assets/img/whatsapp-preview-v3.jpg?v=9');
  }

  // If HTTP/HTTPS URL
  if (targetImg.startsWith('http')) {
    const optimizedUrl = targetImg.includes('/lg/') ? targetImg.replace('/lg/', '/md/') : targetImg;
    return res.redirect(302, optimizedUrl);
  }

  // If Base64 Data URL
  if (targetImg.startsWith('data:image')) {
    const matches = targetImg.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const mimeType = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
      return res.status(200).send(buffer);
    }
  }

  return res.redirect(302, 'https://www.inmobiliariadevorafernandez.com.ar/assets/img/whatsapp-preview-v3.jpg?v=9');
};
