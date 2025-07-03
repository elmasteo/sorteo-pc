const fetch = require('node-fetch');
const nodemailer = require('nodemailer');

const GH_TOKEN = process.env.GH_TOKEN;
const REPO = 'elmasteo/sorteo-pc';
const FILE_PATH = 'boletas.json';
const BRANCH = 'master';

exports.handler = async (event) => {
  try {
    const { numero, nombre, telefono } = JSON.parse(event.body);

    const headers = {
      'Authorization': `token ${GH_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json'
    };

    // Obtener contenido actual de boletas.json
    const getRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, { headers });
    if (!getRes.ok) {
      return { statusCode: 500, body: 'Error al obtener boletas' };
    }

    const file = await getRes.json();
    const content = Buffer.from(file.content, 'base64').toString();
    const boletas = JSON.parse(content);

    // Verifica si la boleta existe y sigue libre
    const boleta = boletas.find(b => b.numero == numero);
    if (!boleta) {
      return { statusCode: 404, body: 'Boleta no encontrada' };
    }
    if (boleta.estado !== 'libre') {
      return { statusCode: 409, body: 'Boleta ya reservada por otra persona' };
    }

    // Actualizar el estado de la boleta
    boleta.estado = 'pendiente';
    boleta.nombre = nombre;
    boleta.telefono = telefono;

    // Subir los cambios
    const newContent = Buffer.from(JSON.stringify(boletas, null, 2)).toString('base64');
    const putRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: `Reserva boleta ${numero}`,
        content: newContent,
        sha: file.sha,
        branch: BRANCH
      })
    });

    if (!putRes.ok) {
      const error = await putRes.json();
      if (putRes.status === 409 || error?.message?.includes('sha')) {
        return {
          statusCode: 409,
          body: 'Conflicto al guardar: la boleta pudo haber sido modificada por otro usuario. Intenta de nuevo.'
        };
      }
      return { statusCode: 500, body: 'Error al guardar boleta' };
    }

        const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Sorteo PC" <${process.env.MAIL_USER}>`,
      to: "sago980302@hotmail.com", // te lo mandas a ti mismo
      subject: `Nueva reserva de boleta #${numero}`,
      html: `
        <h2>🎟️ Nueva Reserva</h2>
        <p><strong>Boleta:</strong> #${numero}</p>
        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Teléfono:</strong> ${telefono}</p>
        <p><small>Este mensaje fue generado automáticamente.</small></p>
      `
    });

    return { statusCode: 200, body: 'Reservado correctamente' };
  } catch (err) {
    return { statusCode: 500, body: 'Error interno: ' + err.message };
  }
};
