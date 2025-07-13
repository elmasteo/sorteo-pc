exports.handler = async (event) => {
  const { auth, ganador } = JSON.parse(event.body || '{}');

  if (auth !== process.env.ADMIN_KEY) {
    return { statusCode: 403, body: 'Clave incorrecta' };
  }

  const token = process.env.GITHUB_TOKEN;
  const repoOwner = "elmasteo";
  const repoName = "sorteo-pc";
  const branch = "master";
  const filePath = "ganador.json";

  const apiBase = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;

  const ganadorJson = JSON.stringify(ganador, null, 2);
  const encodedContent = Buffer.from(ganadorJson).toString('base64');

  let sha = null;

  // 1. Verificar si el archivo existe (para obtener el SHA)
  const getResp = await fetch(`${apiBase}?ref=${branch}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "netlify-function",
      Accept: "application/vnd.github.v3+json",
    }
  });

  if (getResp.ok) {
    const json = await getResp.json();
    sha = json.sha;
  } else if (getResp.status !== 404) {
    return {
      statusCode: 500,
      body: `Error al verificar el archivo: ${await getResp.text()}`,
    };
  }

  // 2. Crear o actualizar el archivo ganador.json
  const putResp = await fetch(apiBase, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "netlify-function",
      Accept: "application/vnd.github.v3+json",
    },
    body: JSON.stringify({
      message: `🎯 Ganador: ${ganador}`,
      content: encodedContent,
      branch,
      ...(sha && { sha }), // solo incluye SHA si existe
    }),
  });

  if (!putResp.ok) {
    return {
      statusCode: 500,
      body: `Error al guardar archivo: ${await putResp.text()}`,
    };
  }

  return {
    statusCode: 200,
    body: "Ganador actualizado correctamente",
  };
};
