const router=require('express').Router();
const pool=require('../db/con');



router.post('/',async(req,res)=>{
    try {
        
    const {username}=req.body
    const notifications=await pool.query('SELECT * from notifications WHERE to_user=$1 AND status=$2',[username,0])
    return res.json(notifications.rows);
        
    } catch (error) {
        return res.json(error.message)
    }
    
})


router.post('/therapist_notifications',async (req,res) =>{
   
    try {
        const {fullname}=req.body
        const notifications=await pool.query(`SELECT * from therapist_notifications WHERE to_user=$1 AND status<>$2`,[fullname,1])
        return res.json(notifications.rows) 
    } catch (error) {
        console.error(error.message)
    }

});


router.get('/readnotifications/:n_id',async(req,res)=>{
    try {
    const n_id=req.params.n_id
    const updatednotifications=await pool.query(`UPDATE notifications
    SET status =$1
    WHERE n_id=$2`,[1,n_id])
    res.json(updatednotifications.rows[0]);
        
    } catch (error) {
        
    }
    
})

router.get('/read_therapist__notifications/:tn_id',async(req,res)=>{
    try {
    const tn_id=req.params.tn_id
    const updatednotifications=await pool.query(`UPDATE therapist_notifications
    SET status =$1
    WHERE tn_id=$2`,[1,tn_id])
    res.json(updatednotifications.rows[0]);
        
    } catch (error) {
        console.error(error.message);
        
    }
    
})


module.exports=router;