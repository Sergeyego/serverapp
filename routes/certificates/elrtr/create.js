module.exports = function (app) {
    /*let fs = require('fs');
    app.get('/certificates/elrtr/:IdSert', async (req, res) => {        
        try {
            result = fs.readFileSync('routes/certificates/template.html', { encoding: 'utf-8' });
            res.type('text/html');
            res.send(result);
          } catch (error) {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
          }
    })*/
    app.use('/certificates/elrtr/:IdSert', async (req, res) => {   
        res.render('template.hbs');
    } )
}