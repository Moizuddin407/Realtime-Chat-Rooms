# Realtime Chat Rooms

A modern real-time chat application that enables users to create and join chat rooms, exchange messages in real-time, and see other users' online status. Built with Next.js 14, Socket.IO, and Prisma.

## Features
- 💬 Real-time messaging
- 🚪 Multiple chat rooms
- 👥 User presence indicators
- 🌓 Dark/Light theme
- 📎 File sharing
- 😊 Emoji reactions
- 📱 Responsive design

## Tech Stack
- Next.js 14
- Socket.IO
- Prisma
- PostgreSQL
- TailwindCSS
- TypeScript

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/Moizuddin407/Realtime-Chat-Rooms
   ```

2. Install dependencies:

   ```bash
   cd Realtime-Chat-Rooms
   npm install
   ```

3. Set up your environment variables:

   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your database connection string.

4. Run database migrations:

   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/chatdb"
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.