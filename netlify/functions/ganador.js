const { Octokit } = require("@octokit/rest");

exports.handler = async (event) => {
  const { auth, ganador } = JSON.parse(event.body || '{}');

  if (auth !== process.env.ADMIN_KEY) {
    return { statusCode: 403, body: 'Clave incorrecta' };
  }

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  const repoOwner = "elmasteo";
  const repoName = "sorteo-pc";
  const filePath = "ganador.json";
  const branch = "master";

  const ganadorData = JSON.stringify(ganador, null, 2);
  const encodedContent = Buffer.from(ganadorData).toString('base64');

  try {
    // Obtener SHA del archivo si ya existe
    let sha = null;
    try {
      const { data } = await octokit.repos.getContent({
        owner: repoOwner,
        repo: repoName,
        path: filePath,
      });
      sha = data.sha;
    } catch (err) {
      if (err.status !== 404) throw err;
    }

    // Subir archivo con commit
    await octokit.repos.createOrUpdateFileContents({
      owner: repoOwner,
      repo: repoName,
      path: filePath,
      message: `🎯 Ganador: ${ganador.numero}`,
      content: encodedContent,
      branch,
      sha,
    });

    return {
      statusCode: 200,
      body: "Ganador actualizado correctamente",
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: `Error: ${err.message}`,
    };
  }
};
