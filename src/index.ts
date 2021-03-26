import express from 'express'
import bodyParser from 'body-parser'
import { WebClient } from '@slack/web-api'
import dotenv from 'dotenv'
import firebase from 'firebase'
import 'firebase/firestore'

dotenv.config()
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

// NOTE: 何か良い書き方ないかな
const token = process.env.token
const apiKey = process.env.apiKey
const authDomain = process.env.authDomain
const projectId = process.env.projectId
const client  = new WebClient(token)
const channel =  "C01MHAGJE4F"

firebase.initializeApp({
  apiKey: apiKey,
  authDomain: authDomain,
  projectId: projectId,
})

const db = firebase.firestore()
const roomRef = db.collection("room").doc("information")
const usersRef = db.collection("users")

app.get('/', (req, res) => {
  const array: string[] = []
  usersRef.get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      array.push(doc.id)
    })
  })
  const text = array.join(', ')
  const count = array.length
  return res.send(`${text}, ${count}`)
})

app.post('/zoom/webhook', (req, res) => {
  const user = req.body.payload.object.participant.user_name
  const event = req.body.event
  if(event == "meeting.participant_joined") {
    // ここを書き換える
    usersRef.doc(user).set({
      name: user
    })
    .then(() => {
      console.log("document set");
    })
    deleteRoomStatusMessage()
    postRoomStatusMessage()
    res.send("ok")
  } else if(event == "meeting.participant_left") {
    usersRef.doc(user).delete().then(() => {
      console.log("Document successfully deleted!");
    }).catch((error) => {
      console.error("Error removing document: ", error);
    });
    deleteRoomStatusMessage()
    postRoomStatusMessage()
    res.send("ok")
  } else {
    return res.send("ok")
  }
})

app.listen(process.env.PORT || 3000, () => console.log("server is listening"))

const generateRoomStatusText = () => {
  let { text, count } = generateRoomMemberText()
  const result = `
  *もくもく会の状況*\n現在の参加人数: ${count}\n現在のメンバー: ${text}`
  return result
}

const generateRoomMemberText = () => {
  const array: string[] = []
  usersRef.get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      array.push(doc.id)
    })
  })
  const text = array.join(', ')
  const count = array.length
  return {text, count}
}

const deleteRoomStatusMessage = () => {
  roomRef.get().then((doc) => {
    if (doc.exists) {
      client.chat.delete({
        channel: channel,
        ts: doc.data().id
      }).then(() => {
        console.log("deleted message");
      }).catch( error => {
        console.log(error);
      })
    } else {
      console.log("No such document!");
    }
  }).catch((error) => {
    console.log("Error getting document:", error);
  })
}

const postRoomStatusMessage = () => {
  client.chat.postMessage({
    channel: channel,
    text: generateRoomStatusText()
  }).then(response => {
    saveTextId(response.ts)
  }).catch( error => {
    console.log(error);
  })
}

const saveTextId = (postId: any) => {
  roomRef.set({
    id: postId
  })
  .then(() => {
    console.log("document set");
  })
}