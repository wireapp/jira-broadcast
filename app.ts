import { Application, Router } from 'https://deno.land/x/oak/mod.ts';

const env = Deno.env.toObject();

const port = parseInt(env.PORT || '8000');
const romanBroadcast = env.ROMAN_BROADCAST || 'https://roman.integrations.zinfra.io/broadcast';
const romanAppKey = env.ROMAN_APP_KEY;
const jiraBaseUrl = env.JIRA_BASE_URL || 'https://wearezeta.atlassian.net/browse';

const app = new Application();
const router = new Router();

router.post('/jira', async ({ response, request }) => {
  try {
    const body = await request.body({ type: 'json' }).value;
    const message = formatBodyToWireMessage(body);
    response.status = await broadcastTextToWire(message);
  } catch (e) {
    console.log(e);
    response.status = 500;
  }
});

const formatBodyToWireMessage = ({ issue }: { issue: any }) => {
  const { key, fields } = issue;
  const { summary, reporter } = fields
  const issueUrl = `${jiraBaseUrl}/${key}`;
  return `Issue: [${key}](${issueUrl})\n__${summary}__ reported by __${reporter.displayName}__`;
};

const broadcastTextToWire = async (message: string) => {
  const response = await fetch(
    romanBroadcast,
    {
      method: 'POST',
      headers: { 'app-key': romanAppKey, 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'text', text: { data: message, mentions: [] } })
    }
  );
  if (response.status != 200) {
    console.log(await response.json());
  }
  return response.status;
};

// k8s indication the service is running
router.get('/status', ({ response }) => {
  response.status = 200;
});
// technical endpoint to display the version
router.get('/version', ({ response }) => {
  response.body = { version: 'hello world' };
});
// respond 200 to Roman when joining the conversations
router.post('/roman', ({ response }) => {
  response.status = 200;
});

app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener('listen', () => console.log(`Listening on localhost:${port}`));

await app.listen({ port });