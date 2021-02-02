import { Application, Router } from 'https://deno.land/x/oak/mod.ts';

const env = Deno.env.toObject();

const port = parseInt(env.PORT || '8000');
const romanBroadcast = env.ROMAN_BROADCAST || 'https://roman.integrations.zinfra.io/broadcast';
const romanBearerToken = env.ROMAN_TOKEN || 'some-token';
const jiraBaseUrl = env.JIRA_BASE_URL || 'https://wearezeta.atlassian.net/browse';

const app = new Application();

const router = new Router();

router.post('/jira', async ({ response, request }) => {
  const body = await request.body({ type: 'json' }).value;
  const message = formatBodyToWireMessage(body);

  response.status = await broadcastTextToWire(message);
});

const formatBodyToWireMessage = (body: any) => {
  const { user, issue } = body;
  const usersName = user.displayName;

  const { key, fields } = issue;
  const issueUrl = `${jiraBaseUrl}/${key}`;
  // todo maybe other stuff is interesting as well
  const { summary } = fields;
  return `Issue: (${key})[${issueUrl}]\n__${summary}__ by __${usersName}__`;
};

const broadcastTextToWire = async (message: string) => {
  const body = { type: 'text', text: { data: message } };
  const response = await fetch(
    romanBroadcast,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${romanBearerToken}` },
      body: JSON.stringify(body)
    }
  );
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
router.get('/roman', ({ response }) => {
  response.status = 200;
});

app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener('listen', () => {
  console.log(`Listening on localhost:${port}`);
});

await app.listen({ port });
