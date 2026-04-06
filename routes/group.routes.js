const express = require("express");
const router = express.Router();
const {
  createGroup,
  getAllGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  managePermission,
  addAdmin,
} = require("../controllers/group.controller");
const { protect } = require("../middleware/auth.middleware");
const {
  validate,
  createGroupSchema,
  updateGroupSchema,
  memberActionSchema,
  permissionActionSchema,
} = require("../utils/validation");

// All group routes require authentication
router.use(protect);

// GET  /api/groups
// POST /api/groups
router.route("/").get(getAllGroups).post(validate(createGroupSchema), createGroup);

// GET    /api/groups/:id
// PUT    /api/groups/:id
// DELETE /api/groups/:id
router
  .route("/:id")
  .get(getGroupById)
  .put(validate(updateGroupSchema), updateGroup)
  .delete(deleteGroup);

// POST /api/groups/:id/members        - add member
router.post("/:id/members", validate(memberActionSchema), addMember);

// DELETE /api/groups/:id/members      - remove member
router.delete("/:id/members", validate(memberActionSchema), removeMember);

// POST /api/groups/:id/admins         - promote member to admin
router.post("/:id/admins", validate(memberActionSchema), addAdmin);

// PATCH /api/groups/:id/permissions   - grant or revoke post permission
router.patch("/:id/permissions", validate(permissionActionSchema), managePermission);

module.exports = router;
