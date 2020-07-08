const pool = require("../db/con");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../db/auth_config");

const verifymail = (userEmail) => {
  const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return regex.test(userEmail);
};

const verifyusername = (user_name) => {
  if (user_name.length > 15) {
    return false;
  } else {
    return true;
  }
};

const Signup = async (req, res) => {
  try {
    let access_lvl = "1";
    const {
      fullname,
      phone,
      age,
      username,
      email,
      pass,
      account_type,
    } = req.body;

    let pic;
    if (req.files) {
      pic = req.files.file;
      pic.mv(`${__dirname}/public/userimgs/${pic.name}`, function (err) {
        if (err) {
          console.error(err.message);
        }
      });
    }

    //set access_lvl according to account type
    if (account_type === "listener") {
      access_lvl = 1;
    } else {
      access_lvl = 2;
    }

    const created_at = new Date().toISOString();

    //check for existing user
    const user = await pool.query(
      "SELECT username,email FROM users WHERE email=$1 OR username=$2",
      [email, username]
    );

    if (user.rows.length !== 0) {
      return res
        .status(401)
        .send("User Already exist please log in with your credentials");
    }

    if (
      fullname.length == 0 ||
      email.length == 0 ||
      username.length == 0 ||
      pass.length == 0 ||
      phone.length == 0 ||
      age.length == 0
    ) {
      return res.status(401).send("Missing Details");
    } else if (!verifymail(email)) {
      return res.status(401).send("Invalid Email");
    } else if (!verifyusername(username)) {
      return res.status(401).send("Invalid username");
    }

    const salt = await bcrypt.genSalt();
    const hashpass = await bcrypt.hash(pass, salt);

    const newUser = await pool.query(
      "INSERT into users(fullname,email,username,pass,phone,age,pic,created_at,access_lvl) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *",
      [
        fullname,
        email,
        username,
        hashpass,
        phone,
        age,
        pic.name,
        created_at,
        access_lvl,
      ]
    );

    if (newUser) {
      const token = jwt.sign({ id: newUser.rows[0].user_id }, config.secret);

      if (token) {
        await pool.query(`Update users SET online=$1 WHERE user_id=$2`,[1,newUser.rows[0].user_id])
        return res.json({
          token,
          user: newUser.rows[0],
        });
      }
    } else {
      res.status(401).send("Something went wrong while creating your account");
    }
  } catch (err) {
    console.error( err.message );
  }
};

const login = async (req, res) => {
  try {
    const { email, pass } = req.body;
    if (!verifymail(email)) {
      return res.status(401).send("Invalid Email");
    }
    if (email.length == 0 || pass.length == 0) {
      return res.status(401).send("Missing Credentials");
    }
    const checkuser = await pool.query("SELECT * from users where email=$1", [
      email,
    ]);
    if (checkuser.rows.length == 0) {
      return res.status(401).send("User with that Email does not exist");
    }
    const matchpass = await bcrypt.compare(pass, checkuser.rows[0].pass);
    if (!matchpass) {
      return res.status(401).send("Invalid Credentials");
    }
    const token = jwt.sign({ id: checkuser.rows[0].user_id }, config.secret);
    if (token) {
      await pool.query(`Update users SET online=$1 WHERE user_id=$2`,[1,checkuser.rows[0].user_id])
      return res.json({
        token,
        user: {
          id: checkuser.rows[0].user_id,
          fullname: checkuser.rows[0].fullname,
          username: checkuser.rows[0].username,
          email: checkuser.rows[0].email,
        },
      });
    }
  } catch (error) {
   console.error(error.message);
  }
};

//verify the token
const verify = async (req, res) => {
  try {
    const token = req.header("x-auth-token");
    if (!token) return res.json(false);
    const verified = jwt.verify(token, config.secret);
    if (!verified) return res.json(false);
    const user = await pool.query("SELECT * from users WHERE user_id=$1", [
      verified.id,
    ]);
    if (!user) return res.json(false);
    return res.json(true);
  } catch (error) {
    console.error(error);
  }
};

exports.Signup = Signup;
exports.Login = login;
exports.verify = verify;