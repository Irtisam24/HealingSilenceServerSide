const router=require('express').Router();

const profileController=require('../controllers/profile-controller')

//Routes
router.get('/:userid',profileController.getProfile)
router.post('/countposts',profileController.getpostcount)




module.exports=router;