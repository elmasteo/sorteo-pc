const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  const { numero, nombre, telefono } = JSON.parse(event.body);
  const file = path.join(__dirname, '../../data/boletas.json');
  const data = JSON.parse(fs.readFileSync(file));

  const boleta = data.find(b => b.numero === numero);
  if (!boleta || boleta.estado !== 'libre') return { statusCode: 400, body: 'No disponible' };

  boleta.estado = 'pendiente';
  boleta.nombre = nombre;
  boleta.telefono = telefono;

  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return { statusCode: 200, body: 'Reservado' };
};