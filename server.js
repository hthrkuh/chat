const express = require("express");
const app = express();
const path = require('path')

// const React = require('react')
// const { renderToString } = require('react-dom/server');

// const App = require('../views/src/App')
const socket = require("socket.io");
const color = require("colors");
const cors = require("cors");
const { get_Current_User, user_Disconnect, join_User } = require("./dummyuser");


// app.use(express());
// // app.use(express.static(path.join(__dirname, 'OnlineChat-React-hooks-main')))
// app.use(express.static(path.join(__dirname, 'views')))
// app.set('views', path.join(__dirname, 'views/src'))
//     .set('view engine', 'jsx')
//     .engine('jsx', require('express-react-views').createEngine())
//     .get('/', (req, res) => res.render('index.jsx'));
// .set('views', path.join(__dirname, 'views'))
// 
// 

app.use(express.static(path.join(__dirname, 'build')));


app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// app.get('/', (req, res) => {
//     const appString = renderToString(<App />);

//     res.send(template({
//         body: appString,
//         title: 'FROM THE SERVER'
//     }));
// });


const port = 3050;

app.use(cors());

var server = app.listen(
    port,
    console.log(
        `Server is running on the port no: ${(port)} `
            .green
    )
);
// server.set('origins', '*:*');
// const io = socket(server);
const io = socket(server, {
    cors: {
        origin: '*',
    }
});

function time() {
    let date = new Date();
    let minute = date.getMinutes();
    let hour = date.getHours();
    let day = date.getDate();
    let month = date.getMonth();
    let year = date.getFullYear();
    return [hour, String(minute).padStart(2, '0')].join(":")
}

//initializing the socket io connection 
io.on("connection", (socket) => {
    console.log("New client connected");

    //for a new user joining the room
    socket.on("joinRoom", (username, roomname) => {
        //* create user
        const p_user = join_User(socket.id, username, roomname);
        console.log(socket.id, "=id");
        socket.join(p_user.room);

        //display a welcome message to the user who have joined a room
        socket.emit("msg-from-server", {
            userId: p_user.id,
            username: p_user.username,
            text: `Server :Welcome ${p_user.username} you are joined the room!`,
            time: time()
        });

        //displays a joined room message to all other room users except that particular user
        socket.broadcast.to(p_user.room).emit("msg-from-server", {
            userId: p_user.id,
            username: p_user.username,
            text: `Server : ${p_user.username} has joined the chat`,
            time: time()
        });
    });

    //user sending message
    socket.on("msg-from-client", (text) => {
        //gets the room user and the message sent
        const p_user = get_Current_User(socket.id);

        io.to(p_user?.room).emit("msg-from-server", {
            userId: p_user?.id,
            username: p_user?.username,
            client: true,
            text: text,
            time: time()
        });
    });

    //user sending message
    socket.on("userdata", () => {
        //gets the room user and the message sent
        const p_user = get_Current_User(socket.id);
        socket.emit("userdata", {
            userId: p_user?.id,
            username: p_user?.username,
        });
        // io.to(p_user.room).emit("userdata", {
        //     userId: p_user.id,
        //     username: p_user.username,
        // });
    });

    //when the user exits the room
    socket.on("disconnect", () => {
        //the user is deleted from array of users and a left room message displayed
        const p_user = user_Disconnect(socket.id);

        if (p_user) {
            io.to(p_user.room).emit("msg-from-server", {
                userId: p_user.id,
                username: p_user.username,
                text: `Server : ${p_user.username} has left the room`,
                time: time()
            });
        }
    });
});