var express = require('express');

var app = express();

const port = 7000;

app.get('/', (req, res) => {
  res.status(200).type('text/plain');
  res.send('Welcome to the server');
})

require('./routes/certificates/elrtr/qr.js')(app);

require('./routes/invoices/elrtr/workshop.js')(app);
require('./routes/invoices/elrtr/warehouse.js')(app);
require('./routes/invoices/elrtr/warehouseday.js')(app);

require('./routes/invoices/wire/workshop.js')(app);
require('./routes/invoices/wire/warehouse.js')(app);
require('./routes/invoices/wire/warehouseday.js')(app);
require('./routes/invoices/wire/semifinished.js')(app);
require('./routes/invoices/wire/perepack.js')(app);

require('./routes/acceptances/elrtr/api.js')(app);
require('./routes/acceptances/wire/api.js')(app);

app.use((req, res, next) => {
  res.status(404).type('text/plain');
  res.send('Not found');
})

app.listen(port, () => {
  console.log(`Server app listening on port ${port}`);
})
