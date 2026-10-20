# ORBIT — Full-Stack Social Media Platform

A full-stack social media and real-time messaging platform built with the MERN stack. ORBIT offers secure authentication, media-rich posts, social interactions, and a responsive chat experience across desktop and mobile devices.

<p align="left">
  <a href="https://orbit-one-inky.vercel.app">
    <img src="https://img.shields.io/badge/Live_Demo-Visit_ORBIT-2563EB?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" />
  </a>
  <a href="https://github.com/vijayvar440/SocalSnap">
    <img src="https://img.shields.io/badge/GitHub-Source_Code-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Repository" />
  </a>
  <a href="https://linkedin.com/in/vijay-var">
    <img src="https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn Profile" />
  </a>
</p>

---

## 🚀 Live Application

**Try ORBIT:** https://orbit-one-inky.vercel.app

Explore the application to experience its social features and responsive user interface.

## ✨ Key Features

- **Authentication & Security** — User registration, login, logout, JWT authentication, HTTP-only cookies, and protected routes.
- **Real-Time Messaging** — Responsive chat interface with message history, deletion, and media support.
- **Social Interactions** — Follow and unfollow users, search for users, and interact with posts.
- **Post Management** — Create and manage posts containing text, images, videos, and audio.
- **Media Uploads** — Cloudinary integration for supported media and profile-image uploads.
- **User Profiles** — Customizable profiles and social connections.
- **Dark & Light Mode** — Switch between themes.
- **Responsive Design** — Mobile-friendly layouts with support for dynamic viewport heights and on-screen keyboards.

## 🛠️ Technology Stack

### Frontend
- React.js
- React Router
- Axios
- CSS3 — Flexbox, custom properties, and animations
- Lucide / React Icons

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT authentication
- bcrypt password hashing
- Multer
- Cloudinary
- Cookie-Parser
- CORS

## 🏗️ Architecture

ORBIT separates the frontend and backend so that the user interface and API can be developed and deployed independently.

- **Frontend:** React application deployed on Vercel.
- **Backend:** Node.js and Express REST API.
- **Database:** MongoDB.
- **Media Storage:** Cloudinary.

## 📂 Project Structure

```text
ORBIT/
├── Frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── CSS/
│   │   └── App.jsx
│   └── package.json
│
└── BACKEND/
    ├── controller/
    ├── model/
    ├── router/
    ├── middlewares/
    ├── config/
    ├── server.js
    └── package.json
```

*Note: The directory names above are representative. Adjust them to match the actual repository structure.*

## 💻 Getting Started

### Prerequisites
- Node.js and npm
- MongoDB connection string
- Cloudinary credentials if using its media-upload features

### 1. Clone the repository

```bash
git clone https://github.com/vijayvar440/SocalSnap.git
cd SocalSnap
```

### 2. Configure the backend

Navigate to the backend directory and install dependencies:

```bash
cd BACKEND
npm install
```

Create a `.env` file using the environment variable names required by your backend code. Never commit secrets, database credentials, JWT secrets, or Cloudinary API secrets.

### 3. Start the backend

Use the start script defined in `BACKEND/package.json`. For example, if the project defines a `start` script:

```bash
npm start
```

### 4. Start the frontend

Open another terminal, navigate to `Frontend`, install dependencies, and start the development server using the script defined in its `package.json`.

```bash
cd Frontend
npm install
npm run dev
```

## 🔐 Security Notes

- Keep sensitive credentials in environment variables.
- Use secure cookie settings appropriate to the deployment environment.
- Configure CORS for trusted frontend origins.
- Validate and sanitize user input.
- Never publish `.env` files or private keys.

## 👨‍💻 Author

**Vijay Var**

Full-Stack Web Developer | MERN Stack | React.js | Node.js | Express.js | MongoDB

- **LinkedIn:** https://linkedin.com/in/vijay-var
- **GitHub:** https://github.com/vijayvar440

---

*Built as a full-stack web development project to explore authentication, social interactions, media handling, and real-time communication.*
