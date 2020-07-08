const pool=require('../db/con');


const checkinput=(input)=>{

    if(input.length===0){
        return false
    }
    else{
        return true
    }
}


//get comments
const index=async(req,res)=>{

    const postid=req.params.postid;
    try {
        const allcomments=await pool.query(`SELECT creative_corner_post_comments.comment_id,
        creative_corner_post_comments.post,
        creative_corner_post_comments.author,
        creative_corner_post_comments.comment,
        users.username,
        users.pic 
        FROM creative_corner_post_comments
        INNER JOIN users ON creative_corner_post_comments.author=users.user_id
        WHERE post=$1
        ORDER BY creative_corner_post_comments.comment_id DESC`,[postid])
        
        if(allcomments){
            res.json(allcomments.rows)
        }else{
            res.status(401).send('Something went wrong please try again letter')
        }
        
    } catch (error) {
        console.error(error)
    }
}

//post new comment
const PostComment=async(req,res)=>{
    
    const {post_id,comment,user_id}=req.body;
    

    try {
    
        if(!checkinput(comment)){
            return res.status(400).json('A post must have title')
        }
        
        const newcomment=await pool.query('INSERT INTO creative_corner_post_comments(post,author,comment) VALUES($1,$2,$3) RETURNING *',
        [post_id,user_id,comment])
        if(newcomment){
            return res.json(newcomment.rows[0])
        }else{
            return res.status(401).send('Something went wrong please try again later')
        }
    
    } catch (error) {
        console.error(error)
    }

}

exports.Index=index;
exports.PostComment=PostComment;