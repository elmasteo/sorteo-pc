import { Octokit } from "@octokit/core";

exports.handler = async (event) => {
  const { auth, ganador } = JSON.parse(event.body || '{}');

  if (auth !== process.env.ADMIN_CLAVE) {
    return { statusCode: 403, body: 'Clave incorrecta' };
  }

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  const repoOwner = "elmasteo";
  const repoName = "sorteo-pc";
  const filePath = "ganador.json"; // puedes cambiar la carpeta si lo deseas
  const branch = "master"; // o 'master'

  const ganadorData = JSON.stringify(ganador, null, 2);

  try {
    // Verifica si ya existe el archivo para obtener su SHA
    let sha = null;
    try {
      const { data } = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
        owner: repoOwner,
        repo: repoName,
        path: filePath,
      });
      sha = data.sha;
    } catch (err) {
      if (err.status !== 404) throw err; // Ignora si no existe
    }

    await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
      owner: repoOwner,
      repo: repoName,
      path: filePath,
      message: `🎯 Ganador: ${ganador.numero}`,
      content: Buffer.from(ganadorData).toString('base64'),
      branch,
      sha,
    });

    return {
      statusCode: 200,
      body: "Ganador actualizado correctamente"
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: `Error: ${err.message}`
    };
  }
};
