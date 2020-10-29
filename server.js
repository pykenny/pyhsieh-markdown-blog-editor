const path = require('path');
const express = require('express')
const app = express()
const port = 3000

/* Rendering Engine Settings */
app.set('view engine', 'pug')
app.set('views', './views')

/* Static Files Settings */
CSS_STATIC_PATH = 'node_modules/purecss/build'
app.use('/css', express.static(path.join(__dirname, CSS_STATIC_PATH)));

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/test_rendering', function (req, res) {
  res.render('index', { title: 'Hey', message: 'Hello there!' })
})

app.get('/grid_test', function(req, res) {
  res.render('grid_test', { title: 'Hey', message: 'Hello there!' })
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
