const express = require('express')
const https = require('https');
const app = express()
const port = 3000

const romanBroadcast = "https://roman.integrations.zinfra.io/broadcast"

function sendBroadcast(text) {
  const data = JSON.stringify({
    todo: 'Buy the milk',
  })

  const options = {
    hostname: 'yourwebsite.com',
    port: 443,
    path: '/todos',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  }

  const req = https.request({  }, (res) => {
    console.log(`statusCode: ${res.statusCode}`)

    res.on('data', (d) => {
      process.stdout.write(d)
    })
  })

  req.on('error', (error) => {
    console.error(error)
  })

  req.write(data)
  req.end()

}

const jiraBase = "https://wearezeta.atlassian.net/browse/"

app.use(express.json())

app.post('/', (req, res) => {
  try {
    console.log(req.query['userprde']['world'])
  } catch (e) {
    console.log(e)
  }

  console.log(req.body['hello'])
  res.send()

  http.request('http://jsonplaceholder.typicode.com/posts/1', (response) => {
    response.pipe(res);
  }).on('error', function(e) {
    res.sendStatus(500);
  }).end();
})


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})