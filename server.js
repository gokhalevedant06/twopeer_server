const socket = require("websocket").server
const http = require("http")

const server = http.createServer((req,res)=>{
    if(req.url=='/test' && req.method=="GET")
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify("HELLO FROM TWOPEER SERVER"))
})

server.listen(5000, () => {
    console.log("Listening on port 5000")
})

const websocket = new socket({httpServer:server})

let users = []

websocket.on('request',(req)=>{
    const connection = req.accept()

    connection.on('message',(message)=>{
        console.log(message)
        const data = JSON.parse(message.utf8Data)

        const user = findUser(data.username)
        
        switch(data.type){
            case "store_user":
                if(user!=null) break;
                const newUser = {
                    connection,
                    username:data.username
                }
                users.push(newUser)
                console.log(newUser.username)
                break

            case "store_offer":
                    if(user==null)
                    return
                    user.offer = data.offer
                    break

               
            case "store_candidate":
                 if(user==null) return
                 
                 if(user.candidates==null) user.candidates = []

                 user.candidates.push(data.candidate)
                 break

            case "send_answer":
                console.log("USER ANSWER",user)
                if(user==null) return
                console.log("SENDING ANS TO SENDER")
                console.log(data)
                sendData({
                    type:"answer",
                    answer:data.answer
                },user.connection)
                console.log(user)
                break

            case "send_candidate":
                if(user==null) return
                sendData({
                    type:"candidate",
                    ans:data.candidate
                },user.connection)
                break
            
            case "join_call":
                console.log("JOINING",user)
                // console.log("HERE",data)
                if(user==null) return
                sendData({
                    type:"offer",
                    offer:user.offer
                },connection)

                user.candidates.forEach(candidate=>{
                    sendData({
                        type:"candidate",
                        candidate
                    },connection)
                })

                break
            }
    })

    connection.on('close',(reason,description)=>{
        users.forEach(user=>{
            if(user.connection==connection){
                users.splice(users.indexOf(user),1);
                return
            }
        })
    })
})


const findUser = (username)=>{
    // console.log("RUNNING FIND USER",username)
    for(var i=0;i<users.length;i++){
        if(users[i].username==username) return users[i]
    }
}

const sendData = (data,connection)=>{
    connection.send(JSON.stringify(data))
}