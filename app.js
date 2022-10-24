const docx = require('docx');
const app = require('express')()

const host = '127.0.0.1'
const port = 7000

app.get('/home', async (req, res) => {
  res.status(200).type('text/plain')
  res.send('Home page')
})

app.get('/about', (req, res) => {
  res.status(200).type('text/plain')
  res.send('About page')
})

/*app.post('/api/admin', (req, res) => {
  res.status(200).type('text/plain')
  res.send('Create admin request')
})

app.post('/api/user', (req, res) => {
  res.status(200).type('text/plain')
  res.send('Create user request')
})*/

require('./routes/test.js')(app);
require('./routes/invoices/elrtr/workshop.js')(app);

app.use((req, res, next) => {
  res.status(404).type('text/plain')
  res.send('Not found')
})

app.listen(port, host, function () {
  console.log(`Server listens http://${host}:${port}`)
})
