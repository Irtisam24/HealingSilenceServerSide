const express=require('express');
const router=express.Router();

const CommunityController=require('../controllers/community-controller')

router.get('/',CommunityController.Index)
router.get('/:catid',CommunityController.allThreadsInCategory)
router.get('/thread/:topicid',CommunityController.getPost)
router.post('/createthread',CommunityController.createPost)
router.post('/createtopic',CommunityController.createTopic)

module.exports=router;