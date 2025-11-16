# LockedIN - Aesthetic Workspace & Productivity App

A full-stack productivity application with Pomodoro timer, task planner, and integrated Spotify player.

## Tech Stack

**Frontend:** Angular 17, TypeScript
**Backend:** Spring Boot, Java 17, MySQL
**Deployment:** Render (Backend), Netlify/Vercel (Frontend)

## Prerequisites

Before running this project, make sure you have:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Angular CLI** (optional but recommended)

## Frontend Setup (Angular)

### 1. Clone the Repository

```bash
git clone https://github.com/mikedimeji/LockedIN.git
cd LockedIN/frontend/locked-in-ui
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages from `package.json`.

### 3. Run the Development Server

```bash
ng serve
```

Or if you don't have Angular CLI globally:

```bash
npm start
```

The app will run at `http://localhost:4200`

### 4. Build for Production

```bash
ng build --configuration production
```

Build files will be in `dist/locked-in-ui/`

## Backend Setup (Spring Boot)

### Prerequisites
- **Java 17** - [Download here](https://adoptium.net/)
- **Maven** (or use included Maven wrapper)
- **MySQL** database

### 1. Navigate to Backend

```bash
cd backend
```

### 2. Configure Database

Update `src/main/resources/application-local.properties` with your database credentials.

### 3. Run the Backend

```bash
./mvnw spring-boot:run
```

Or on Windows:

```bash
mvnw.cmd spring-boot:run
```

Backend will run at `http://localhost:8080`

## Environment Configuration

### Frontend API URL

By default, the frontend connects to `https://lockedin-backend.onrender.com`.

To use your local backend instead, update the API URLs in:
- `src/app/auth.service.ts`
- `src/app/gold-streak.service.ts`
- Other service files

Change from:
```typescript
private apiUrl = 'https://lockedin-backend.onrender.com/api';
```

To:
```typescript
private apiUrl = 'http://localhost:8080/api';
```

## Features

- 🍅 **Pomodoro Timer** - Stay focused with customizable work/break intervals
- ✅ **Task Planner** - Organize your daily tasks
- 🎵 **Spotify Integration** - Play music while you work
- 🎨 **Customizable Themes** - Aesthetic backgrounds and themes
- 🔥 **Streak Tracking** - Build productive habits
- 🪙 **Reward System** - Earn gold for completing tasks

## Troubleshooting

### Port Already in Use

If port 4200 is already in use:
```bash
ng serve --port 4300
```

### Node Modules Issues

If you encounter dependency issues:
```bash
rm -rf node_modules package-lock.json
npm install
```

### CSP Errors

If you see Content Security Policy errors, make sure your `angular.json` includes the correct `connect-src` for the backend URL.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Contact

Michael Oladimeji - [@mikedimeji](https://github.com/mikedimeji)

Project Link: [https://github.com/mikedimeji/LockedIN](https://github.com/mikedimeji/LockedIN)