const pool = require("../db/con");
const bcrypt = require("bcryptjs");

//get all the data to show to the admin
const Index = async (req, res) => {
  try {
    const users = await pool.query(`SELECT * FROM users
    ORDER BY created_at DESC`);

    const creative_corner_posts = await pool.query(`SELECT creative_corner_posts.post_id,
        creative_corner_posts.post_title,
        creative_corner_posts.post_desc,
        creative_corner_posts.post_img,
        creative_corner_posts.created_at,
        users.username FROM creative_corner_posts
        INNER JOIN users ON users.user_id=creative_corner_posts.author
        WHERE approved=$1
        ORDER BY creative_corner_posts.created_at DESC`,[1]);

    const forum_posts = await pool.query(`SELECT posts.post_id,
        posts.post_desc,
        posts.created_at,
        users.username,
        topics.topic_title FROM posts
        INNER JOIN users on users.user_id=posts.author
        INNER JOIN topics on topics.topic_id=posts.topic_id
        ORDER BY posts.created_at DESC`);

    const categories = await pool.query(`SELECT * FROM categories`);

    const therapists = await pool.query(`SELECT * FROM therapists
    ORDER BY created_at DESC`);

    const topics = await pool.query(`SELECT topics.topic_id,
        topics.topic_title,
        topics.topic_desc,
        topics.created_at,
        users.username,
        categories.cat_title
        FROM topics
        INNER JOIN users ON users.user_id=topics.author
        INNER JOIN categories ON categories.cat_id=topics.cat_id
        ORDER BY topics.created_at DESC`);

        const pendingApprovalPosts=await pool.query(`SELECT creative_corner_posts.post_id,
        creative_corner_posts.post_title,
        creative_corner_posts.post_desc,
        creative_corner_posts.post_img,
        creative_corner_posts.created_at,
        users.username FROM creative_corner_posts
        INNER JOIN users ON users.user_id=creative_corner_posts.author
        WHERE approved <>$1
        ORDER BY creative_corner_posts.created_at DESC`,[1]);

    return res.json({
      user: users.rows,
      creative_corner_posts: creative_corner_posts.rows,
      forum_posts: forum_posts.rows,
      categories: categories.rows,
      therapists: therapists.rows,
      topics: topics.rows,
      pendingApprovalPosts:pendingApprovalPosts.rows
    });
  } catch (error) {
    console.log(error.message);
  }
};

//create newtherapist
const createTherapist = async (req, res) => {
  let img = "";
  const { fullname, email, username, pass, age, phone, education } = req.body;
  const created_at = new Date().toISOString();
    //if img upload it 
  if (req.files) {
    img = req.files.file;
    img.mv(`${__dirname}/public/therapists/${img.name}`, function (err) {
      if (err) {
        console.error(err);
      }
    });
  }
  const salt = await bcrypt.genSalt();
  const hashpass = await bcrypt.hash(pass, salt);
  try {
    //check for existing therapist
    const therapist = await pool.query(
      "SELECT username,email FROM therapists WHERE email=$1 OR username=$2",
      [email, username]
    );

    if (therapist.rows.length !== 0) {
      return res.status(401).send("Therapist Already exists");
    }
    const newTherapist = await pool.query(
      `INSERT into therapists (fullname,email,username,pass,phone,age,education,pic,created_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        fullname,
        email,
        username,
        hashpass,
        phone,
        age,
        education,
        img.name,
        created_at,
      ]
    );
    if (newTherapist) {
      return res.status(200).send("New Therapist Created");
    }
  } catch (error) {
    console.error(error.message);
  }
};

//create NewCategory
const createCategory = async (req, res) => {
  const { cat_title, cat_desc } = req.body;

  try {
    const newCatgory = await pool.query(
      "INSERT INTO categories(cat_title,cat_desc) VALUES ($1,$2)",
      [cat_title, cat_desc]
    );
    if (newCatgory) {
      return res.status(200).send("New Category created");
    } else {
      return res.status(401).send("Something went Wrong Please Try again Later");
    }
  } catch (error) {
    console.error(error.message);
  }
};

//edit the selected user
const editUser = async (req, res) => {
  const { user_id, fullname, email, username, age, phone } = req.body;
  try {
    const editedUser = await pool.query(
      `UPDATE users
        SET fullname=$1,
        email=$2,
        username=$3,
        age=$4,
        phone=$5 WHERE user_id=$6`,
      [fullname, email, username, age, phone, user_id]
    );
    if (editedUser) {
      return res.status(200).send("User Updated");
    } else {
      return res.status(401).send("Something went Wrong Please Try again Later");
    }
  } catch (error) {
    console.error(error.message);
  }
};

//edit the selected Therapist
const editTherapist = async (req, res) => {
  const { t_id, fullname, email, username, age, phone, education } = req.body;

  try {
    const editedTherapist = await pool.query(
      `UPDATE therapists
        SET fullname=$1,
        email=$2,
        username=$3,
        age=$4,
        phone=$5,
        education=$6 WHERE t_id=$7`,
      [fullname, email, username, age, phone, education, t_id]
    );
    if (editedTherapist) {
      return res.status(200).send("Therapist Updated");
    } else {
      return res.status(401).send("Something went Wrong Please Try again Later");
    }
  } catch (error) {
    console.error(error.message);
  }
};

//edit the selected Category
const editCategory = async (req, res) => {
  const { cat_id, cat_title, cat_desc } = req.body;
  try {
    const editedCategory = await pool.query(
      `UPDATE categories
        SET cat_title=$1,
        cat_desc=$2 WHERE cat_id=$3`,
      [cat_title, cat_desc, cat_id]
    );
    if (editedCategory) {
      return res.status(200).send("Category Updated");
    } else {
      return res.status(401).send("Something went Wrong Please Try again Later");
    }
  } catch (error) {
    console.error(error.message);
  }
};

//edit selected creative corner post
const editCCPost = async (req, res) => {
  const { post_id, post_title, post_desc } = req.body;
  try {
    const editedCCPost = await pool.query(
      `UPDATE creative_corner_posts
        SET post_title=$1,
        post_desc=$2 WHERE post_id=$3`,
      [post_title, post_desc, post_id]
    );
    if (editedCCPost) {
      return res.status(200).send("Post Updated");
    } else {
      return res.status(401).send("Something went Wrong Please Try again Later");
    }
  } catch (error) {
    console.error(error.message);
  }
};

//edit the selected Topic
const editTopic = async (req, res) => {
  const { topic_id, topic_title, topic_desc } = req.body;
  try {
    const editedThread = await pool.query(
      `UPDATE topics
        SET topic_title=$1,
        topic_desc=$2 WHERE topic_id=$3`,
      [topic_title, topic_desc, topic_id]
    );
    if (editedThread) {
      return res.status(200).send("Thread Updated");
    } else {
      return res.status(401).send("Something went Wrong Please Try again Later");
    }
  } catch (error) {
    console.error(error.message);
  }
};

//edit The selected Post
const editPost = async (req, res) => {
  const { post_id, post_desc } = req.body;
  try {
    const editedPost = await pool.query(
      `UPDATE posts
        SET post_desc=$1 WHERE post_id=$2`,
      [post_desc, post_id]
    );
    if (editedPost) {
      return res.status(200).send("Post Updated");
    } else {
      return res.status(401).send("Something went Wrong Please Try again Later");
    }
  } catch (error) {
    console.error(error.message);
  }
};


//approve a creative corner post

const approvepost=async (req,res)=>{
  const {post_id}=req.body
  
  try {
    const approvePost=await pool.query(`Update creative_corner_posts
    SET approved=1 WHERE post_id=$1`,[post_id])
    if(approvePost){
      return res.status(200).send('Post Approved')
    }
  } catch (error) {
    console.error(error.message)
  }
}

exports.Index = Index;
exports.createTherapist = createTherapist;
exports.createCategory = createCategory;
exports.editUser = editUser;
exports.editTherapist = editTherapist;
exports.editCategory = editCategory;
exports.editCCPost = editCCPost;
exports.editTopic = editTopic;
exports.editPost = editPost;
exports.approvePost=approvepost;