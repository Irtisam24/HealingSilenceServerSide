const router=require('express').Router();
const auth=require('../middleware/auth');
const pool=require('../db/con');


const userController=require('../controllers/users-controller')

//Routes
router.post('/signup',userController.Signup)
router.post('/login',userController.Login)
router.post('/verify',userController.verify)
router.get('/getuser',auth,async(req,res)=>{
    
    const user=await pool.query('SELECT * from users WHERE user_id=$1',[req.user])
    res.json(user);
})

router.get('/getlistener/:user_id',async(req,res)=>{
    const user_id=req.params.user_id
    const user=await pool.query('SELECT * from users WHERE user_id=$1',[user_id])
    res.json(user.rows[0]);
})

router.post('/logout',async(req,res)=>{

    const{user_id}=req.body
    try {
        const logout=await pool.query('Update users SET online=$1 WHERE user_id=$2',[0,user_id])
        if(logout){
            return res.json('Logged Out')
        }    
    } catch (error) {
        console.error(error.message);
    }
    
})


module.exports=router;