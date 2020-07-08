const pool = require("../db/con");

//show all categories
const Index = async (req, res) => {
  const CategoriesData = await pool.query(`SELECT DISTINCT ON (categories.cat_id) *
    From categories
    INNER JOIN topics on categories.cat_id=topics.cat_id
    ORDER BY categories.cat_id,topics.created_at DESC`);

  const totalthreads = await pool.query(`SELECT c.cat_id, COUNT(a.topic_id)
    FROM categories AS c
    LEFT JOIN topics AS a ON c.cat_id = a.cat_id
    GROUP BY c.cat_id`);
  return res.json([CategoriesData.rows, totalthreads.rows]);
};


// get all threads and threads count in the selected category
const allThreadsInCategory = async (req, res) => {
  const cat_id = req.params.catid;

  const allthreads = await pool.query(
    `SELECT categories.cat_title,categories.cat_id,
    topics.topic_id,topics.topic_title,
    users.username
    FROM categories
    INNER JOIN topics ON categories.cat_id=topics.cat_id
    INNER JOIN users on users.user_id=topics.author
    WHERE categories.cat_id=$1
    ORDER BY topics.created_at desc`,
    [cat_id]
  );

  //post count
  const totalpost = await pool.query(`SELECT t.topic_id, COUNT(p.post_id)
    FROM topics AS t
    INNER JOIN posts AS p ON t.topic_id = p.topic_id
    GROUP BY t.topic_id`);

  return res.json([allthreads.rows, totalpost.rows]);
};

//get post and topic title details
const getPost = async (req, res) => {
  const topic_id = req.params.topicid;
  try {
    const titleDetails = await pool.query(
      `SELECT t.topic_title,
    t.topic_desc,t.created_at,t.topic_pic,u.username,u.pic from topics AS t
    INNER JOIN users AS u on u.user_id=t.author
    WHERE topic_id=$1`,
      [topic_id]
    );

    const postDetails = await pool.query(
      `SELECT p.post_id,
    p.post_desc,
    p.post_pic,
    p.created_at,
    u.username,
    u.pic
    FROM posts AS p
    INNER JOIN users AS u on u.user_id=p.author
    INNER JOIN topics AS t on p.topic_id=t.topic_id
    WHERE p.topic_id=$1`,
      [topic_id]
    );

    if (postDetails) {
      return res.json([titleDetails.rows, postDetails.rows]);
    }
  } catch (error) {
    console.error(error.message);
  }
};

// create a post in the selected topic
const createPost = async (req, res) => {
  let img = "";

  const { userid, topicid, reply } = req.body;
  //check for file uploads
  if (req.files) {
    img = req.files.file;
    await img.mv(`${__dirname}/public/forumposts/${img.name}`, function (err) {
      if (err) {
        console.error(err.message);
      }
    });
  }
  try {
    const newPost = await pool.query(
      `INSERT INTO posts(topic_id,author,post_desc,post_pic) VALUES ($1,$2,$3,$4)`,
      [topicid, userid, reply, img.name]
    );
    if (newPost) {
      return res.json(newPost.rows);
    } else {
      return res.status(401).send("Something went wrong please try again");
    }
  } catch (error) {
    console.error(error.message);
  }
};

//create a topic
const createTopic = async (req, res) => {
  let img = "";

  const { userid, catid, topictitle, topicdesc } = req.body;
  
  //check for file uploads
  if (req.files) {
    img = req.files.file;
    await img.mv(`${__dirname}/public/forumposts/${img.name}`, function (err) {
      if (err) {
        console.error(err.message);
      }
    });
  }
  try {
    const newTopic = await pool.query(
      `INSERT INTO topics(cat_id,author,topic_title,topic_desc,topic_pic) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [catid, userid, topictitle, topicdesc, img.name]
    );
    if (newTopic) {
      return res.json(newTopic.rows);
    } else {
      return res.status(401).send("Something went wrong please try again");
    }
  } catch (error) {
    console.error(error.message);
  }
};

exports.Index = Index;
exports.allThreadsInCategory = allThreadsInCategory;
exports.getPost = getPost;
exports.createPost = createPost;
exports.createTopic = createTopic;