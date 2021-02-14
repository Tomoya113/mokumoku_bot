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
let requestCount = 0;

app.post('/zoom/webhook', (req, res) => {
  requestCount += 1
  console.log("requestCount:", requestCount);
  
  const user = req.body.payload.object.participant.user_name
  const event = req.body.event
  if(event == "meeting.participant_joined") {
    count += 1
    users.push(user)
    if(ts !== "") {
      deleteRoomStatusMessage()
    }
    postRoomStatusMessage()
    res.send("ok")
  } else if(event == "meeting.participant_left") {
    count -= 1
    if(count < 0) count = 0;
    users.splice(users.indexOf(user), 1)
    // メッセージを消す
    deleteRoomStatusMessage()
    // メッセージを送信
    postRoomStatusMessage()
    res.send("ok")
  } else {
    return res.send("ok")
  }
})

app.listen(process.env.PORT || 3000, () => console.log("server is listening"))

const generateRoomStatusText = () => {
  const text = `
  *もくもく会の状況*\n現在の参加人数: ${count}\n現在のメンバー: ${generateRoomMemberText()}
  `
  return text
}

const generateRoomMemberText = () => {
  const text = users.join(', ')
  return text
}

const deleteRoomStatusMessage = () => {
  client.chat.delete({
    channel: channel,
    ts: ts
  }).then(() => {
    console.log("deleted message");
  }).catch( error => {
    console.log(error);
  })
}

const postRoomStatusMessage = () => {
  client.chat.postMessage({
    channel: channel,
    text: generateRoomStatusText()
  }).then(response => {
    ts = response.ts
  }).then(() => {
    console.log("posted message");
  }).catch( error => {
    console.log(error);
  })
}

// const searchRoomStatusMessage = () => {
//   client.search.messages({
//     query: "",
//     sort: "timestamp",
//     sort_dir: "desc"
//   })
// }
// client.search.messages()