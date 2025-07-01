const fetch = require('node-fetch');

const GH_TOKEN = process.env.GH_TOKEN;
const REPO = 'elmasteo/sorteo-pc'; // tu repositorio
const FILE_PATH = 'boletas.json';
const BRANCH = 'master';
const PASSWORD = process.env.ADMIN_KEY;

exports.handler = async (event) => {
  const body = JSON.parse(event.body || '{}');
  if (body.auth !== PASSWORD) {
    return { statusCode: 401, body: 'No autorizado' };
  }

  const headers = {
    'Authorization': `token ${GH_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json'
  };

  // Obtener archivo actual
  const getRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, { headers });
  const file = await getRes.json();

  if (!file || !file.content || !file.sha) {
    return { statusCode: 500, body: 'Error al obtener boletas' };
  }

  const content = Buffer.from(file.content, 'base64').toString();
  const boletas = JSON.parse(content);

  let mensajeCommit = '';

  if (body.confirmar) {
    const boleta = boletas.find(b => b.numero === body.confirmar);
    if (!boleta || boleta.estado !== 'pendiente') {
      return { statusCode: 400, body: 'Boleta no está pendiente o no existe' };
    }
    boleta.estado = 'pagado';
    mensajeCommit = `Confirmación de pago boleta ${boleta.numero}`;
  }

  if (body.liberar) {
    const boleta = boletas.find(b => b.numero === body.liberar);
    if (!boleta || boleta.estado !== 'pendiente') {
      return { statusCode: 400, body: 'Boleta no está pendiente o no existe' };
    }
    boleta.estado = 'libre';
    delete boleta.nombre;
    delete boleta.telefono;
    mensajeCommit = `Liberación de boleta ${boleta.numero}`;
  }

  if (mensajeCommit) {
    const newContent = Buffer.from(JSON.stringify(boletas, null, 2)).toString('base64');

    const updateRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: mensajeCommit,
        content: newContent,
        sha: file.sha,
        branch: BRANCH
      })
    });

    if (!updateRes.ok) {
      return { statusCode: 500, body: 'No se pudo actualizar el archivo' };
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ boletas })
  };
};
