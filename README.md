# 📝 Blog Application API

A production-like REST API for a full-featured blog platform built with **Express.js**, **MongoDB/Mongoose**, **JWT authentication**, **ImageKit media uploads**, and **role-based access control**.

---

## 🚀 Features

- ✅ JWT Authentication (Register / Login)
- ✅ Password hashing with bcrypt
- ✅ Role-based access: `user`, `admin`, `super-admin`
- ✅ Full CRUD for Users, Posts, Groups
- ✅ Image upload to **ImageKit** (multiple images per post)
- ✅ Facebook-style Groups (admins, members, post permissions)
- ✅ Super Admin overrides all rules
- ✅ Global error handling + custom `AppError` class
- ✅ Input validation with **Joi**
- ✅ Rate limiting (100 req / 15 min)
- ✅ Pagination & full-text search on posts
- ✅ Bonus: Comments system + Likes system
- ✅ Vercel deployment ready

---

## 📁 Project Structure

```
/blog-app
  /controllers
    auth.controller.js
    user.controller.js
    post.controller.js
    group.controller.js
    comment.controller.js
  /models
    user.model.js
    post.model.js
    group.model.js
    comment.model.js
  /routes
    auth.routes.js
    user.routes.js
    post.routes.js
    group.routes.js
    comment.routes.js
  /middleware
    auth.middleware.js      ← protect + restrictTo
    upload.middleware.js    ← multer + uploadOnImageKit
    error.middleware.js     ← global error handler
  /utils
    AppError.js
    jwt.js
    validation.js
  /config
    db.js
    imagekit.js
  server.js
  app.js
  vercel.json
  .env.example
```

---

## 🌐 API Reference

### Auth

| Method | Endpoint             | Description       | Auth |
| ------ | -------------------- | ----------------- | ---- |
| POST   | `/api/auth/register` | Register new user | ❌   |
| POST   | `/api/auth/login`    | Login & get JWT   | ❌   |

### Users

| Method | Endpoint               | Description      | Auth                    |
| ------ | ---------------------- | ---------------- | ----------------------- |
| GET    | `/api/users`           | Get all users    | admin / super-admin     |
| GET    | `/api/users/:id`       | Get user by ID   | ✅                      |
| GET    | `/api/users/:id/posts` | Get user's posts | ✅                      |
| PUT    | `/api/users/:id`       | Update user      | ✅ (own or super-admin) |
| DELETE | `/api/users/:id`       | Delete user      | ✅ (own or super-admin) |

### Posts

| Method | Endpoint              | Description                       | Auth                      |
| ------ | --------------------- | --------------------------------- | ------------------------- |
| GET    | `/api/posts`          | Get all accessible posts          | ✅                        |
| POST   | `/api/posts`          | Create post (multipart/form-data) | ✅                        |
| GET    | `/api/posts/:id`      | Get single post                   | ✅                        |
| PUT    | `/api/posts/:id`      | Update post                       | ✅ (owner or super-admin) |
| DELETE | `/api/posts/:id`      | Delete post                       | ✅ (owner or super-admin) |
| POST   | `/api/posts/:id/like` | Toggle like                       | ✅                        |

#### Query Parameters for GET /api/posts

- `page` (default: 1)
- `limit` (default: 10)
- `search` — full-text search in title & content

### Groups

| Method | Endpoint                      | Description                  | Auth        |
| ------ | ----------------------------- | ---------------------------- | ----------- |
| GET    | `/api/groups`                 | Get all groups               | ✅          |
| POST   | `/api/groups`                 | Create group                 | ✅          |
| GET    | `/api/groups/:id`             | Get group by ID              | ✅          |
| PUT    | `/api/groups/:id`             | Update group                 | group admin |
| DELETE | `/api/groups/:id`             | Delete group                 | group admin |
| POST   | `/api/groups/:id/members`     | Add member                   | group admin |
| DELETE | `/api/groups/:id/members`     | Remove member                | group admin |
| POST   | `/api/groups/:id/admins`      | Promote to admin             | group admin |
| PATCH  | `/api/groups/:id/permissions` | Grant/revoke post permission | group admin |

### Comments (Bonus)

| Method | Endpoint                     | Description         | Auth       |
| ------ | ---------------------------- | ------------------- | ---------- |
| GET    | `/api/comments/post/:postId` | Get post's comments | ✅         |
| POST   | `/api/comments/post/:postId` | Add comment         | ✅         |
| PUT    | `/api/comments/:id`          | Update comment      | ✅ (owner) |
| DELETE | `/api/comments/:id`          | Delete comment      | ✅ (owner) |

---

## 📤 Creating a Post (Image Upload)

Use `multipart/form-data`:

```
POST /api/posts
Authorization: Bearer <token>
Content-Type: multipart/form-data

Fields:
  title    (string, required)
  content  (string, required)
  group    (ObjectId, optional)
  images   (file[], required — up to 10 images)
```

---

## 🔐 Role System

| Role          | Capabilities                                 |
| ------------- | -------------------------------------------- |
| `user`        | CRUD own posts, join groups, comment, like   |
| `admin`       | All user capabilities + manage group members |
| `super-admin` | Full system access — override all rules      |

---

## 🛡️ Middleware Summary

| Middleware             | Purpose                                                |
| ---------------------- | ------------------------------------------------------ |
| `protect`              | Verifies JWT, attaches `req.user`                      |
| `restrictTo(...roles)` | Blocks access by role                                  |
| `upload`               | Multer — buffers images in memory                      |
| `uploadOnImageKit`     | Uploads buffers to ImageKit, sets `req.uploadedImages` |
| `globalErrorHandler`   | Catches all errors, formats response                   |

---

## 📦 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT + bcryptjs
- **Validation**: Joi
- **File Upload**: Multer + ImageKit SDK
- **Rate Limiting**: express-rate-limit
- **Deployment**: Vercel
