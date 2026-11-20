module.exports = async (req, res) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Token de GitHub no configurado en el servidor. Contactá al administrador.' });
  }

  const { files } = req.body;
  // files = [{ path: "data/properties.json", content: "...", message: "..." }, ...]

  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: 'No se enviaron archivos para publicar.' });
  }

  const owner = 'devoraf258admi-create';
  const repo = 'inmobiliaria-devora-fernandez';
  const branch = 'main';
  const results = [];

  try {
    for (const file of files) {
      const filePath = file.path;
      const content = file.content;
      const message = file.message || `Actualización de ${filePath} desde Panel de Administración`;

      // 1. Get current SHA
      const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}&t=${Date.now()}`;
      const getRes = await fetch(getUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      let currentSha = null;
      if (getRes.ok) {
        const fileInfo = await getRes.json();
        currentSha = fileInfo.sha;
      } else if (getRes.status !== 404) {
        const errText = await getRes.text();
        throw new Error(`Error obteniendo ${filePath}: ${getRes.status} - ${errText}`);
      }

      // 2. Encode content to base64
      const base64Content = Buffer.from(content, 'utf8').toString('base64');

      // 3. PUT updated file
      const putBody = {
        message,
        content: base64Content,
        branch
      };
      if (currentSha) {
        putBody.sha = currentSha;
      }

      const putRes = await fetch(getUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(putBody)
      });

      if (!putRes.ok) {
        const errData = await putRes.json().catch(() => ({}));
        throw new Error(errData.message || `Error guardando ${filePath} en GitHub (${putRes.status})`);
      }

      results.push({ path: filePath, status: 'ok' });
    }

    return res.status(200).json({ success: true, results });
  } catch (err) {
    console.error('Error en publish:', err);
    return res.status(500).json({ error: err.message });
  }
};
