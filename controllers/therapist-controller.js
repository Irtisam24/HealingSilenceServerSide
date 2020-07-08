const pool = require("../db/con");


//get list of therapists
const Index = async (req, res) => {
  try {
    const allTherapists = await pool.query(`SELECT t.t_id, t.fullname,
        t.email,
        t.username,
        t.phone,
        t.age,
        t.education,
        t.pic,
        COUNT(therapist_conversations.tc_id)
        FROM therapists as t
        FULL OUTER JOIN therapist_conversations ON t.fullname=therapist_conversations.user2
        GROUP BY t.t_id`);

    if (allTherapists) {
      return res.json(allTherapists.rows);
    } else {
      return res.status(401).send("Something went wrong please try again later");
    }
  } catch (error) {
    console.error(error.message);
  }
};

//selected therapist details
const getTherapistDetails = async (req, res) => {
  const therapistid = req.params.therapistid;
  try {
    const therapistDetails = await pool.query(
      `SELECT * from therapists
        WHERE t_id=$1`,
      [therapistid]
    );
    if (therapistDetails) {
      return res.json(therapistDetails.rows[0]);
    } else {
      return res.status(401).send( "Something went Wrong please try again" );
    }
  } catch (error) {
    console.error(error.message);
  }
};

//Therapist Details By fullname
const getTherapistDetailsByFullname=async (req,res)=>{
    const {fullname}=req.body
    try {
        const details=await pool.query('SELECT * from therapists WHERE fullname=$1',[fullname])
        if(details.rows.length >0){
            return res.json(details.rows[0])
        } else{
           return res.status(401).send('Something went wrong try again')
        }
    } catch (error) {
        console.error(error.message);
        
    }
}



//get All threads for the logged in user
const getallThreads = async (req, res) => {
  try {
    const { username } = req.body;
    let threads = [];
    const getthreads = await pool.query(
      `SELECT * FROM(
        SELECT DISTINCT ON (therapist_conversations.tc_id) therapist_conversations.tc_id,
        therapist_conversations.user1,
        therapist_conversations.user2,
          therapist_messages.message,
          therapist_messages.created_at
        FROM therapist_conversations
        INNER JOIN therapist_messages on therapist_messages.tc_id=therapist_conversations.tc_id
        WHERE user1=$1 or user2=$1
        ORDER BY therapist_conversations.tc_id )t
        ORDER BY created_at DESC`,
      [username]
    );
    if (getthreads) {
      await Promise.all(getthreads.rows.map(async chat => {
        if (chat.user1 === username) {
          const userpic=await pool.query(`SELECT pic,online from therapists WHERE fullname=$1`,[chat.user2])
          
          const {pic,online}=userpic.rows[0]
          threads.push({ thread: chat.user2, tc_id: chat.tc_id,pic:pic,online:online,message:chat.message });
        } else {
          const userpic=await pool.query(`SELECT pic,online from therapists WHERE fullname=$1`,[chat.user1])
          const {pic,online}=userpic.rows[0]
          threads.push({ thread: chat.user1, tc_id: chat.tc_id,pic:pic,online:online,message:chat.message });
        }
      }));

      
      return res.json({ getthreads: getthreads.rows, threads });
    } else {
      return res.status(401).send("Something went wrong");
    }
  } catch (error) {
    console.error(error.message);
  }
};

//getMessages for the selected therapists
const getMessages = async (req, res) => {
  const { username, therapistname } = req.body;

//get conversation
  try {
    const getmsgs = await pool.query(
      `SELECT tc_id,
        user1,
        user2
        FROM therapist_conversations
        WHERE (user1=$1 AND user2=$2)
        OR (user1=$2 AND user2=$1)`,
      [username, therapistname]
    );

    //if conversation exists get messages from that conversation
    if (getmsgs.rows.length > 0) {
      let tc_id = getmsgs.rows[0].tc_id;
      const getallchats = await pool.query(
        `SELECT * FROM
        therapist_messages
        WHERE tc_id=$1`,
        [tc_id]
      );

      //if messages then send it to front end
      if (getallchats.rows.length > 0) {
        return res.json(getallchats.rows);
      }
    }
  } catch (error) {
    console.error(error.message);
  }
};

//function for getting payment state between user and therapist
const getPaymentsState = async (req, res) => {
  const userid = req.params.userid;
  const therapistid = req.params.therapistid;

  try {
    if (userid) {
      const paymentstate = await pool.query(
        `SELECT * From payments
    WHERE sender_id=$1 and receiver_id=$2`,
        [userid, therapistid]
      );
      if (paymentstate) {
        return res.json(paymentstate.rows);
      } else {
        return res.status(401).send("Something went wrong");
      }
    }
  } catch (error) {
    console.error(error.message);
  }
};

//export all the functions
exports.Index = Index;
exports.getTherapistDetails = getTherapistDetails;
exports.getTherapistDetailsByFullname=getTherapistDetailsByFullname
exports.getallThreads = getallThreads;
exports.getMessages = getMessages;
exports.getPaymentsState = getPaymentsState;