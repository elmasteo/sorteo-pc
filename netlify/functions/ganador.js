exports.handler = async (event) => {
  const { Octokit } = await import("@octokit/rest");

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
    let sha = null;
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner: repoOwner,
        repo: repoName,
        path: filePath,
        ref: branch,
      });
      sha = data.sha;
    } catch (err) {
      if (err.status !== 404) throw err;
    }

    await octokit.rest.repos.createOrUpdateFileContents({
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
