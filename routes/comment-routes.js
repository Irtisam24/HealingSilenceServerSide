const router=require('express').Router();

const commentsController=require('../controllers/comments-controller')


//Routes
router.get('/:postid',commentsController.Index)
router.post('/comment',commentsController.PostComment)




module.exports=router;