import express from 'express'
import bodyParser from 'body-parser'
import { WebClient } from '@slack/web-api'
import dotenv from 'dotenv'

dotenv.config()
const app = express()
app.use(bodyParser.json())

// NOTE: 何か良い書き方ないかな
const token = process.env.token
const client  = new WebClient(token)
const channel =  "C01MHAGJE4F"

// 投稿のIDを保存するやつ
let ts: any = ""
const users: string[] = []
let count = 0;

app.post('/', (req, res) => {
  return res.send("Hello world")
})

app.post('/zoom/webhook', (req, res) => {
  console.log(req.body)
  const user = req.body.payload.object.participant.user_name
  const event = req.body.event
  let message = ""
  console.log(user)
  if(event == "meeting.participant_joined") {
    count += 1
    users.push(user)
    message = `
      *もくもく会の状況*\n現在の参加人数: ${count}\n現在のメンバー: ${generateRoomMemberText()}
    `
    client.chat.postMessage({
      channel: channel,
      text: message
    }).then(response => {
      ts = response.ts
    }).then(() => {
      console.log("sendMessage:", { ts })
    })

  } else if(event == "meeting.participant_left") {
    count -= 1
    if(count < 0) count = 0;

    // メッセージを消す
    client.chat.delete({
      channel: "C01MHAGJE4F",
      ts: ts
    }).then(response => {
      res.send(response)
    })
    
    // メッセージを送信
    message = `
      *もくもく会の状況*\n現在の参加人数: ${count}\n現在のメンバー: ${generateRoomMemberText()}
    `
    client.chat.postMessage({
      channel: channel,
      text: message
    }).then(response => {
      ts = response.ts
    }).then(() => {
      console.log("sendMessage:", { ts })
    })
    
  } else {
    return res.send("ok")
  }
})

app.get('/sendMessage', (req, res) => {
  const message = `
    *もくもく会の状況*\n参加人数: ${count}\nメンバー: ${generateRoomMemberText()}
  `
  client.chat.postMessage({
    channel: channel,
    text: message
  }).then(response => {
    ts = response.ts
  }).then(() => {
    console.log("sendMessage:", { ts })
  })
})

app.get('/deleteMessage', (req, res) => {
  console.log("deleteMessage:", { ts })
})

app.listen(process.env.PORT || 3000, () => console.log("server is listening"))

const generateRoomMemberText = () => {
  const text = users.join(', ')
  return text
}