const router = require("express").Router();

const AdminController = require("../controllers/admin-controller");

router.get("/", AdminController.Index);

//creation routes
router.post("/createtherapist", AdminController.createTherapist);
router.post("/createcategory", AdminController.createCategory);

//editing routes
router.patch("/edituser", AdminController.editUser);
router.patch("/edittherapist", AdminController.editTherapist);
router.patch("/editcategory", AdminController.editCategory);
router.patch("/editccpost", AdminController.editCCPost);
router.patch("/edittopic", AdminController.editTopic);
router.patch("/editpost", AdminController.editPost);

//approve post
router.post('/approvepost',AdminController.approvePost);

module.exports = router;
