const jwt=require('jsonwebtoken');
const config=require('../db/auth_config');

const auth =async (req,res,next)=>{


    try {
 
        const token=req.header('x-auth-token');
    
        if(!token){
            return res.status(401).json('Unauthorized')
        }
        const verified =jwt.verify(token,config.secret);
        if(!verified){
            return res.status(401).json('Unauthorized')
        }
        req.user=verified.id;
        next();
    } catch (error) {
        console.error(error);
    }
}

module.exports=auth;