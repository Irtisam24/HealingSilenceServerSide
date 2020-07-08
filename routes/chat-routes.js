const router=require('express').Router();
const auth=require('../middleware/auth');


const chatController=require('../controllers/chat-controller')

//Routes
router.get('/',chatController.Index)
router.post('/allthreads',chatController.getAllthreads)
router.post('/allchats',chatController.getAllchats)
router.post('/getfirstchat',chatController.getfirstchat)
router.post('/rate',chatController.rateListener)


module.exports=router;