import { Application, Router } from 'https://deno.land/x/oak/mod.ts';

const env = Deno.env.toObject();

const port = parseInt(env.PORT ?? '8080');
const romanBroadcast = env.ROMAN_BROADCAST ?? 'https://roman.integrations.zinfra.io/broadcast';
const romanServiceAuth = env.ROMAN_SERVICE_AUTH;
const jiraBaseUrl = env.JIRA_BASE_URL ?? 'https://wearezeta.atlassian.net/browse';
const jiraProjectsConfigurationFilePath = env.JIRA_PROJECTS_CONFIGURATION_FILE_PATH;

const app = new Application();
const router = new Router();

router.post('/jira/:project', async ({ params, response, request }) => {
  // we can use assert as if no project is given, server returns 404
  const jiraProject = params.project!!;
  const appKey = await retrieveAppKeyForProject(jiraProject);
  if (!appKey) {
    response.status = 404;
    return;
  }

  try {
    const body = await request.body({ type: 'json' }).value;
    const message = formatBodyToWireMessage(body);
    response.status = await broadcastTextToWire(message, appKey);
  } catch (e) {
    console.log(e);
    response.status = 500;
  }
});

const retrieveAppKeyForProject = async (jiraProject: string): Promise<string | undefined> => {
  try {
    const data = await Deno.readTextFile(jiraProjectsConfigurationFilePath);
    return JSON.parse(data)[jiraProject];
  } catch {
  }
};

const formatBodyToWireMessage = ({ issue }: { issue: any }) => {
  const { key, fields } = issue;
  const { summary, reporter } = fields;
  const issueUrl = `${jiraBaseUrl}/${key}`;
  return `Issue: [${key}](${issueUrl})\n__${summary}__ reported by __${reporter.displayName}__`;
};

const broadcastTextToWire = async (message: string, appKey: string) => {
  const response = await fetch(
    romanBroadcast,
    {
      method: 'POST',
      headers: { 'app-key': appKey, 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'text', text: { data: message, mentions: [] } })
    }
  );
  if (response.status >= 400) {
    console.log(await response.json());
  }
  return response.status;
};

// respond 200 to Roman when joining the conversations
router.post('/roman', ({ request, response }) => {
  const authorized = request.headers.get('authorization')?.split(' ')?.find(x => x == romanServiceAuth);
  response.status = authorized ? 200 : 401;
});

/* ----------------- WIRE Common ----------------- */
// k8s indication the service is running
router.get('/status', ({ response }) => {
  response.status = 200;
});
// technical endpoint to display the version
router.get('/version', async ({ response }) => {
  let version;
  const releaseFilePath = Deno.env.get('RELEASE_FILE_PATH');
  if (releaseFilePath) {
    try {
      version = await Deno.readTextFile(releaseFilePath);
    } catch {
    }
  }
  response.body = { version: version ?? 'development' };
});
/* //--------------- WIRE Common ----------------- */

app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener('listen', () => console.log(`Listening on localhost:${port}`));

await app.listen({ port });