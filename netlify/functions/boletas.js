const fs = require('fs');
const path = require('path');

exports.handler = async () => {
  try {
    const filePath = path.resolve(__dirname, '../../boletas.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Filtrar solo datos públicos
    const publicData = data.map(b => ({
      numero: b.numero,
      estado: b.estado
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(publicData)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error al cargar boletas' })
    };
  }
};
