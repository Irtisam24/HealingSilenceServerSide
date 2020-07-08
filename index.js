const express = require("express");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const cors = require("cors");

const stripe = require("stripe")(
  "sk_test_51GxHgdD7aYTGXIEFEe1YpH3rb8xOOA0bPtbxWa5UHVfmYRPL8v0053CAPLQajyaGTxSE5ysb2t8o7MiHPQYTHeh300fJmA0gLc"
);
const { v4: uuidv4 } = require("uuid");
const pool = require("./db/con");

const app = express();

var server = app.listen(5000);
var io = require("socket.io").listen(server);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());

const corsOptions = {
  origin: "*",
  credentials: true,
};

app.use(cors(corsOptions));


//folder for uploads
app.use("/public", express.static(__dirname + "/public"));

//routes files
const userRoutes = require("./routes/users-routes.js");
const creativeRoutes = require("../server/routes/creative-routes");
const creativecommentRoutes = require("./routes/comment-routes");
const communityRoutes = require("../server/routes/community-routes");
const chatRoutes = require("./routes/chat-routes");
const notificationRoutes = require("./routes/notification-routes");
const adminroutes = require("./routes/admin-routes");
const therapistRoutes = require("./routes/therapist-routes");
const profileRoutes=require('./routes/profile-routes');

//chat one on one
io.sockets.on("connection", function (socket) {
  let room1 = "";
  let room2 = "";
  let getmessages;

  socket.on("joining", function (data) {
    room1 = data[0] + "." + data[1];
    room2 = data[1] + "." + data[0];
    socket.join(room1);
    socket.join(room2);
  });

  //volunteer msgs events
  socket.on("private_message", async (data) => {
    const { user1, user2, message } = data;

    //check if conversation already exists
    let getconversation = await pool.query(
      `SELECT * from conversation
        WHERE (user1=$1 AND user2=$2)
        OR (user1=$2 AND user2=$1)`,
      [user1, user2]
    );

    //if no conversation create a conversation
    if (getconversation.rows.length === 0) {
      getconversation = await pool.query(
        `INSERT into conversation (user1,user2) VALUES ($1,$2) Returning *`,
        [user1, user2]
      );
    }
    //if conversation already exist
    if (getconversation.rows.length !== 0) {
      let c_id = getconversation.rows[0].c_id;
      getmessages = await pool.query(
        "Insert into messages (c_id,from_user,message) VALUES($1,$2,$3) Returning *",
        [c_id, user1, message]
      );
      //emit new msg event
      io.to(room1).emit("new_message", getmessages.rows);
      const notification_sent_date = new Date().toISOString();
      const notification = await pool.query(
        `INSERT into notifications(from_user,to_user,sent_at,c_id)
           VALUES ($1,$2,$3,$4) Returning *`,
        [user1, user2, notification_sent_date, c_id]
      );
      if (notification) {
        io.to(room2).emit("notification", notification.rows);
      }
    }
  });

  //Therapist msgs events
  socket.on("therapist_private_message", async (data) => {
    const { user1, user2, message } = data;
    try {
      //check if conversation already exists
      let gettherapistconversation = await pool.query(
        `SELECT * from therapist_conversations
      WHERE (user1=$1 AND user2=$2)
      OR (user1=$2 AND user2=$1)`,
        [user1, user2]
      );
      //if no conversation create a conversation
      if (gettherapistconversation.rows.length === 0) {
        gettherapistconversation = await pool.query(
          `INSERT into therapist_conversations (user1,user2) VALUES ($1,$2) Returning *`,
          [user1, user2]
        );
      }
      //if conversation already exist
      if (gettherapistconversation.rows.length !== 0) {
        let tc_id = gettherapistconversation.rows[0].tc_id;
        //insert msg
        let getTherapistMessages = await pool.query(
          "Insert into therapist_messages (tc_id,from_user,message) VALUES($1,$2,$3) Returning *",
          [tc_id, user1, message]
        );
        //emit new message to connected users
        io.to(room1).emit("new_therapist_message", getTherapistMessages.rows);
        //create notification
        const notification = await pool.query(
          `INSERT into therapist_notifications(from_user,to_user,tc_id)
       VALUES ($1,$2,$3) Returning *`,
          [user1, user2,tc_id]
        );
        if (notification) {
          //emit notification
          io.to(room2).emit("therapist_notification", notification.rows);
        }
      }
    } catch (error) {
      console.error(error.message);
    }
  });
});

// payment route
app.post("/payment", (req, res) => {
  const {
    userid,
    therapist: { t_id },
    therapist,
    token,
  } = req.body;
  const idempotencyKey = uuidv4();
  if(!userid){
    return res.status(401).send('You must be Logged in before you can make Payment')
  }
  return stripe.customers
    .create({
      email: token.email,
      source: token.id,
    })
    .then((customer) => {
      stripe.charges.create(
        {
          amount: 10000 * 100,
          currency: "pkr",
          customer: customer.id,
          source: token.id,
          receipt_email: token.email,
          description: `Therapist Name ${therapist.name}`,
        },
        idempotencyKey
      );
    })
    .then((result) => {
      pool.query(
        `INSERT into payments(sender_id,receiver_id,amount) Values ($1,$2,$3)`,
        [userid, t_id, 10000]
      );
      res.status(200).json(result);
    })
    .catch((error) => console.error(error.message));
});



//routes
app.use("/user", userRoutes);
app.use("/creativecorner", creativeRoutes);
app.use("/creativecorner/comments", creativecommentRoutes);
app.use("/community", communityRoutes);
app.use("/chat", chatRoutes);
app.use("/notifications", notificationRoutes);
app.use("/admin", adminroutes);
app.use("/therapist", therapistRoutes);
app.use('/profile',profileRoutes)

//const PORT=process.env.PORT||5000;