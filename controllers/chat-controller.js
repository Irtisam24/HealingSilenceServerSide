const pool = require("../db/con");

//list all the volunteer listeners
const Index = async (req, res) => {
  const listeners = await pool.query(
    `SELECT DISTINCT ON (u.user_id)
    u.user_id, u.fullname, u.pic,u.username,
    r.rater_id,
    AVG(r.rating),
    COUNT(conversation.c_id)
  FROM users u
  FULL OUTER JOIN ratings r
    ON r.listener_id = u.user_id
  FULL OUTER JOIN conversation on conversation.user2=u.username
  WHERE u.access_lvl=$1
  GROUP BY u.user_id,r.rater_id`,[1]);

console.log(listeners.rows);

  
  if (listeners) {
    return res.json(listeners.rows);
  } else {
    return res.status(401).send("Something went wrong");
  }
};

//get all threads for the logged in user
const getAllthreads = async (req, res) => {
  const { username } = req.body;
  let threads = [];
  const getthreads = await pool.query(
    `SELECT * FROM(
    SELECT DISTINCT ON (conversation.c_id) conversation.c_id,
      conversation.user1,
      conversation.user2,
      messages.message,
     messages.created_at
    FROM conversation
    INNER JOIN messages on messages.c_id=conversation.c_id
    WHERE user1=$1 or user2=$1
    ORDER BY conversation.c_id )t
    ORDER BY created_at DESC`,
    [username]
  );
  
  //if threads exisst
  if (getthreads) {
    
    //get threads for the logged in user if the logged is user is user1 then set the thread to user 2 and if the
    //logged in user is user set the thread to user 1 and get the thread user picture ass well
    
    await Promise.all(getthreads.rows.map(async chat => {
      if (chat.user1 === username) {
        const userpic=await pool.query(`SELECT pic,online from users WHERE username=$1`,[chat.user2])
        const {pic,online}=userpic.rows[0]
        threads.push({ thread: chat.user2, c_id: chat.c_id,pic:pic,online:online,message:chat.message });
      } else {
        const userpic=await pool.query(`SELECT pic,online from users WHERE username=$1`,[chat.user1])
        const {pic,online}=userpic.rows[0]
        threads.push({ thread: chat.user1, c_id: chat.c_id,pic:pic,online:online,message:chat.message });
      }
    }));

    return res.json({ getthreads: getthreads.rows, threads });
  } else {
    return res.status(401).send("Somthing went wrong");
  }
};

//get all messages for a specific thread
const getAllchats = async (req, res) => {
  const { c_id } = req.body;
  const getallchats = await pool.query(
    `SELECT * FROM
    messages
    WHERE c_id=$1`,
    [c_id]
  );
  if (getallchats) {
    return res.json(getallchats.rows);
  } else {
    return res.status(401).send("Somthing went wrong");
  }
};

//get first chat when a user clicks on a listener
const getfirstchat = async (req, res) => {
  const { sender, reciever } = req.body;
  try {
    //get conversation id first
    const getfirstchat = await pool.query(
      `SELECT c_id FROM conversation
      WHERE (user1=$1 AND user2=$2)
      OR (user1=$2 AND user2=$1)`,
      [sender, reciever]
    );
    //if conversation exist get all messages from that conversation
    if (getfirstchat) {
      const c_id = getfirstchat.rows[0].c_id;
      const getfirstchatmessages = await pool.query(
        "SELECT * FROM messages WHERE c_id=$1",
        [c_id]
      );
      if (getfirstchatmessages) {
        return res.json(getfirstchatmessages.rows);
      }
    } else {
      return res.status(401).send("Somthing went wrong");
    }  
  } catch (error) {
    console.error(error.message)
  }
  
};

const rateListener=async(req,res)=>{

  const{user_id,listener_id,rating}=req.body

  try {
    const checkrated=await pool.query('SELECT rating from ratings WHERE listener_id=$1 AND rater_id=$2',[listener_id,user_id])
   
    if(checkrated.rows.length===0){
    const rate=await pool.query(`INSERT INTO ratings(listener_id,rater_id,rating) VALUES($1,$2,$3) RETURNING *`,[listener_id,user_id,rating])

    if(rate){
      res.json(rate.rows[0])
    }
  }
  } catch (error) {
    console.error(error.message);
    
  }


}

exports.Index = Index;
exports.getAllthreads = getAllthreads;
exports.getAllchats = getAllchats;
exports.getfirstchat = getfirstchat;
exports.rateListener=rateListener