const router=require('express').Router()

const therapistController=require('../controllers/therapist-controller')

router.get('/',therapistController.Index)
router.get('/gettherapistdetails/:therapistid',therapistController.getTherapistDetails)
router.post('/getmsgs',therapistController.getMessages)
router.post('/gettherapistbyfullname',therapistController.getTherapistDetailsByFullname)
router.post('/getallthreads',therapistController.getallThreads)
router.get('/getpaymentstate/:userid/:therapistid',therapistController.getPaymentsState)


//export the routes
module.exports=router