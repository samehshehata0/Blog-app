const Group = require("../models/group.model");
const User = require("../models/user.model");
const AppError = require("../utils/AppError");

// ─── Helper: is requesting user a group admin? ────────────────────────────────
const isGroupAdmin = (group, userId) => {
  return (
    group.admins.some((a) => a.toString() === userId.toString()) ||
    userId.role === "super-admin"
  );
};

// ─── Create Group ─────────────────────────────────────────────────────────────
const createGroup = async (req, res, next) => {
  try {
    const { name, description, admins } = req.body;

    // Creator is always an admin; merge with any additional admins provided
    const adminIds = [req.user._id.toString()];
    if (admins && Array.isArray(admins)) {
      admins.forEach((id) => {
        if (!adminIds.includes(id)) adminIds.push(id);
      });
    }

    // Verify all provided admin IDs exist
    const adminUsers = await User.find({ _id: { $in: adminIds } });
    if (adminUsers.length !== adminIds.length) {
      return next(new AppError("One or more admin users not found.", 404));
    }

    const group = await Group.create({
      name,
      description,
      admins: adminIds,
      members: adminIds, // Admins are also members
      postPermissions: adminIds,
    });

    await group.populate("admins members", "username email");

    res.status(201).json({ status: "success", data: { group } });
  } catch (err) {
    next(err);
  }
};

// ─── Get All Groups ───────────────────────────────────────────────────────────
const getAllGroups = async (req, res, next) => {
  try {
    const groups = await Group.find().populate("admins members", "username email");
    res.status(200).json({
      status: "success",
      results: groups.length,
      data: { groups },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get Group By ID ──────────────────────────────────────────────────────────
const getGroupById = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id).populate(
      "admins members postPermissions",
      "username email role"
    );
    if (!group) return next(new AppError("Group not found.", 404));
    res.status(200).json({ status: "success", data: { group } });
  } catch (err) {
    next(err);
  }
};

// ─── Update Group ─────────────────────────────────────────────────────────────
const updateGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return next(new AppError("Group not found.", 404));

    if (req.user.role !== "super-admin" && !isGroupAdmin(group, req.user._id)) {
      return next(new AppError("Only group admins can update this group.", 403));
    }

    const { name, description } = req.body;
    if (name) group.name = name;
    if (description !== undefined) group.description = description;

    await group.save();
    res.status(200).json({ status: "success", data: { group } });
  } catch (err) {
    next(err);
  }
};

// ─── Delete Group ─────────────────────────────────────────────────────────────
const deleteGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return next(new AppError("Group not found.", 404));

    if (req.user.role !== "super-admin" && !isGroupAdmin(group, req.user._id)) {
      return next(new AppError("Only group admins can delete this group.", 403));
    }

    await group.deleteOne();
    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    next(err);
  }
};

// ─── Add Member ───────────────────────────────────────────────────────────────
const addMember = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return next(new AppError("Group not found.", 404));

    if (req.user.role !== "super-admin" && !isGroupAdmin(group, req.user._id)) {
      return next(new AppError("Only group admins can add members.", 403));
    }

    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return next(new AppError("User not found.", 404));

    if (group.members.some((m) => m.toString() === userId)) {
      return next(new AppError("User is already a member of this group.", 400));
    }

    group.members.push(userId);
    await group.save();
    await group.populate("admins members", "username email");

    res.status(200).json({ status: "success", data: { group } });
  } catch (err) {
    next(err);
  }
};

// ─── Remove Member ────────────────────────────────────────────────────────────
const removeMember = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return next(new AppError("Group not found.", 404));

    if (req.user.role !== "super-admin" && !isGroupAdmin(group, req.user._id)) {
      return next(new AppError("Only group admins can remove members.", 403));
    }

    const { userId } = req.body;

    // Prevent removing an admin
    if (group.admins.some((a) => a.toString() === userId)) {
      return next(new AppError("Cannot remove an admin from the group.", 400));
    }

    group.members = group.members.filter((m) => m.toString() !== userId);
    group.postPermissions = group.postPermissions.filter(
      (p) => p.toString() !== userId
    );
    await group.save();
    await group.populate("admins members", "username email");

    res.status(200).json({ status: "success", data: { group } });
  } catch (err) {
    next(err);
  }
};

// ─── Manage Post Permission ───────────────────────────────────────────────────
const managePermission = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return next(new AppError("Group not found.", 404));

    if (req.user.role !== "super-admin" && !isGroupAdmin(group, req.user._id)) {
      return next(new AppError("Only group admins can manage permissions.", 403));
    }

    const { userId, grant } = req.body;

    // User must be a member first
    if (!group.members.some((m) => m.toString() === userId)) {
      return next(new AppError("User must be a member before granting permissions.", 400));
    }

    const hasPermission = group.postPermissions.some((p) => p.toString() === userId);

    if (grant && !hasPermission) {
      group.postPermissions.push(userId);
    } else if (!grant && hasPermission) {
      group.postPermissions = group.postPermissions.filter(
        (p) => p.toString() !== userId
      );
    }

    await group.save();
    await group.populate("admins members postPermissions", "username email");

    res.status(200).json({ status: "success", data: { group } });
  } catch (err) {
    next(err);
  }
};

// ─── Add Admin ────────────────────────────────────────────────────────────────
const addAdmin = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return next(new AppError("Group not found.", 404));

    if (req.user.role !== "super-admin" && !isGroupAdmin(group, req.user._id)) {
      return next(new AppError("Only group admins can promote members.", 403));
    }

    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return next(new AppError("User not found.", 404));

    if (group.admins.some((a) => a.toString() === userId)) {
      return next(new AppError("User is already an admin.", 400));
    }

    // Ensure they are a member first
    if (!group.members.some((m) => m.toString() === userId)) {
      group.members.push(userId);
    }

    group.admins.push(userId);

    // Grant post permission automatically
    if (!group.postPermissions.some((p) => p.toString() === userId)) {
      group.postPermissions.push(userId);
    }

    await group.save();
    await group.populate("admins members", "username email");

    res.status(200).json({ status: "success", data: { group } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createGroup,
  getAllGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  managePermission,
  addAdmin,
};
