const pool = require("../db/con");


const getProfile=async(req,res)=>{

}

const getpostcount=async(req,res)=>{
    const {userid}=req.body
    try {

    const ratings=await pool.query(`SELECT AVG(r.rating) 
    FROM ratings r
    INNER JOIN users u
      ON r.listener_id = u.user_id
      AND u.user_id = $1`,[userid])
    const count={ratings:ratings.rows[0].avg}
    console.log(ratings.rows);
    
    return res.json(count)
    
    } catch (error) {
        console.error(error.message);
        
    }

}

exports.getProfile=getProfile
exports.getpostcount=getpostcount