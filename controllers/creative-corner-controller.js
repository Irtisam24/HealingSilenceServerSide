const pool = require("../db/con");

const checkinput = (input) => {
  if (input.length === 0) {
    return false;
  } else {
    return true;
  }
};

//show all posts
const index = async (req, res) => {
  try {
    const allposts = await pool.query(`SELECT creative_corner_posts.post_id,
        creative_corner_posts.author,
        creative_corner_posts.post_title,
        creative_corner_posts.post_desc,
        creative_corner_posts.post_img,
        creative_corner_posts.created_at,
        users.username 
        FROM creative_corner_posts
        INNER JOIN users ON creative_corner_posts.author=users.user_id 
        WHERE approved=$1
        ORDER BY created_at desc`,[1]);
    if (allposts) {
      res.json(allposts.rows);
    } else {
      res.status(401).send("Something went wrong please try again letter");
    }
  } catch (error) {
    console.error(error);
  }
};

//create new post
const createpost = async (req, res) => {
  let img = "";
  const { title, description, userid } = req.body;
  const created_at = new Date().toISOString();

  //check for file upload
  if (req.files) {
    img = req.files.file;
    img.mv(`${__dirname}/public/posts/${img.name}`, function (err) {
      if (err) {
        console.error(err);
      }
    });
  }

  try {
    if (!checkinput(title)) {
      return res.status(401).send("A post must have title");
    }

    if (!checkinput(description)) {
      return res.status(401).send("A post must have Description");
    }

    const newpost = await pool.query(
      "INSERT INTO creative_corner_posts(author,post_title,post_desc,post_img,created_at) VALUES($1,$2,$3,$4,$5) RETURNING *",
      [userid, title, description, img.name, created_at]
    );
    if (newpost) {
      return res.json(newpost.rows[0]);
    } else {
      return res.status(401).send("Something went wrong please try again later");
    }
  } catch (error) {
    console.error(error);
  }
};

//get specific post
const SinglePost = async (req, res) => {
  const postid = req.params.postid;

  const posts = await pool.query(
    `SELECT creative_corner_posts.post_id,
    creative_corner_posts.author,
    creative_corner_posts.post_title,
    creative_corner_posts.post_desc,
    creative_corner_posts.post_img,
    creative_corner_posts.created_at,
    users.username
    FROM creative_corner_posts
    INNER JOIN users ON creative_corner_posts.author=users.user_id
    WHERE creative_corner_posts.post_id =$1`,
    [postid]
  );

  if (posts) {
    res.json(posts.rows[0]);
  } else {
    res.status(401).send("Something went wrong please try again");
  }
};

exports.Index = index;
exports.Createpost = createpost;
exports.SinglePost = SinglePost;