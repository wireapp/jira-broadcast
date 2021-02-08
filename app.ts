import { Application, helpers, isHttpError, Router, RouterContext } from 'https://deno.land/x/oak@v6.5.0/mod.ts';

const env = Deno.env.toObject();

const port = parseInt(env.PORT ?? '8080');
const romanBroadcast = env.ROMAN_BROADCAST ?? 'https://roman.integrations.zinfra.io/broadcast';
const romanServiceAuth = env.ROMAN_SERVICE_AUTH;
const jiraBaseUrl = env.JIRA_BASE_URL ?? 'https://wearezeta.atlassian.net/browse';
const jiraProjectsConfigurationFilePath = env.JIRA_PROJECTS_CONFIGURATION_FILE_PATH;
const jiraAuthToken = env.JIRA_AUTH_TOKEN ?? null; // null because if no token is given, do not accept the requests by default

const app = new Application();
const router = new Router();

router.post('/jira/:project', async (ctx: RouterContext) => {
  const { token, project } = helpers.getQuery(ctx, { mergeParams: true });
  ctx.assert(token === jiraAuthToken, 401, 'Authorization required.');

  const appKey = await getAppKeyForProject(project.trim().toLowerCase());
  ctx.assert(appKey, 404, `Project "${project}" does not exist.`);

  const body = await ctx.request.body({ type: 'json' }).value;
  ctx.assert(body, 400, 'Body was not a valid JSON.');

  const message = formatBodyToWireMessage(body);
  ctx.response.status = await broadcastTextToWire(message, appKey);
});

const getAppKeyForProject = async (jiraProject: string) => {
  const projectsKeys = await Deno.readTextFile(jiraProjectsConfigurationFilePath).then(text => JSON.parse(text));
  return projectsKeys[jiraProject];
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
  const authorized = request.headers.get('authorization')?.split(' ')?.find(x => x === romanServiceAuth);
  response.status = authorized ? 200 : 401;
});

/* ----------------- WIRE Common ----------------- */
// k8s indication the service is running
router.get('/status', ({ response }) => {
  response.status = 200;
});
// technical endpoint to display the version
router.get('/version', async ({ response }) => {
  let version: string | undefined;
  const releaseFilePath = Deno.env.get('RELEASE_FILE_PATH');
  if (releaseFilePath) {
    try {
      version = await Deno.readTextFile(releaseFilePath).then(text => text.trim());
    } catch {
    }
  }
  response.body = { version: version ?? 'development' };
});
// log all failures that were not handled
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    if (!isHttpError(err)) {
      console.log(err);
    }
    throw err;
  }
});
/* //--------------- WIRE Common ----------------- */

app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener('listen', () => console.log(`Listening on localhost:${port}`));
await app.listen({ port });