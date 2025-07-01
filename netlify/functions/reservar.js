const fetch = require('node-fetch');

const GH_TOKEN = process.env.GH_TOKEN;
const REPO = 'elmasteo/sorteo-pc'; 
const FILE_PATH = 'boletas.json';
const BRANCH = 'master';

exports.handler = async (event) => {
  const { numero, nombre, telefono } = JSON.parse(event.body);

  const headers = {
    'Authorization': `token ${GH_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json'
  };

  // Obtener contenido actual de boletas.json
  const getRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, { headers });
  const file = await getRes.json();
  const content = Buffer.from(file.content, 'base64').toString();
  const boletas = JSON.parse(content);

  // Verifica si está disponible
  const boleta = boletas.find(b => b.numero === numero);
  if (!boleta || boleta.estado !== 'libre') {
    return { statusCode: 400, body: 'Boleta no disponible' };
  }

  boleta.estado = 'pendiente';
  boleta.nombre = nombre;
  boleta.telefono = telefono;

  // Actualizar boletas.json con commit
  const newContent = Buffer.from(JSON.stringify(boletas, null, 2)).toString('base64');
  const updateRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: `Reserva boleta ${numero}`,
      content: newContent,
      sha: file.sha,
      branch: BRANCH
    })
  });

  if (!updateRes.ok) {
    return { statusCode: 500, body: 'Error al guardar' };
  }

  return { statusCode: 200, body: 'Reservado' };
};
