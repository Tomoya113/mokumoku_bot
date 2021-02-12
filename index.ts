import express from 'express'

const app = express()

app.post('/', (req, res) => {
  return res.send("hoge")
})

app.get('/', (req, res) => {
  return res.send("get")
})

app.listen(process.env.PORT || 3000, () => console.log("server is listening"))