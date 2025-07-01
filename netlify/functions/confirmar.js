const fs = require('fs');
const path = require('path');

const PASSWORD = process.env.ADMIN_KEY;

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  if (body.auth !== PASSWORD) return { statusCode: 401, body: 'No autorizado' };

  const file = path.join(__dirname, '../../boletas.json');
  const data = JSON.parse(fs.readFileSync(file));

  if (body.confirmar) {
    const b = data.find(b => b.numero === body.confirmar);
    if (b && b.estado === 'pendiente') b.estado = 'pagado';
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ boletas: data })
  };
};