import express from 'express'
import bodyParser from 'body-parser'

const app = express()
app.use(bodyParser.json())

app.post('/', (req, res) => {
  return res.send("hoge")
})

app.post('/zoom/webhook', (req, res) => {
  return console.log(req.body)
})

app.get('/', (req, res) => {
  return res.send("get")
})

app.listen(process.env.PORT || 3000, () => console.log("server is listening"))