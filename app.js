const docx = require('docx');
const app = require('express')()

const host = '127.0.0.1'
const port = 7000

app.get('/', (req, res) => {
  res.status(200).type('text/plain')
  res.send('Welcome to the server')
})

require('./routes/invoices/elrtr/workshop.js')(app);
require('./routes/invoices/elrtr/warehouse.js')(app);
require('./routes/invoices/elrtr/warehouseday.js')(app);

require('./routes/invoices/wire/warehouse.js')(app);
require('./routes/invoices/wire/warehouseday.js')(app);

app.use((req, res, next) => {
  res.status(404).type('text/plain')
  res.send('Not found')
})

app.listen(port, host, function () {
  console.log(`Server listens http://${host}:${port}`)
})
