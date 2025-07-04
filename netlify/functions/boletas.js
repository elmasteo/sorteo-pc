const fs = require('fs').promises;
const path = require('path');

exports.handler = async () => {
  try {
    const filePath = path.resolve(__dirname, '../../boletas.json');
    const raw = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(raw);

    const filtrado = data.map(({ numero, estado }) => ({ numero, estado }));

    return {
      statusCode: 200,
      body: JSON.stringify(filtrado),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error interno al leer boletas.json' })
    };
  }
};
