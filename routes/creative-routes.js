const router=require('express').Router();

const creativeController=require('../controllers/creative-corner-controller')


//Routes
router.get('/',creativeController.Index)
router.post('/createpost',creativeController.Createpost)
router.get('/:postid',creativeController.SinglePost)




module.exports=router;