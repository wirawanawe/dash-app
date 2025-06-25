import { createServer } from "http";
import { parse } from "url";
import next from "next";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

let server;

// Graceful shutdown function
const gracefulShutdown = (signal) => {
  console.log(`\n> Received ${signal}. Shutting down gracefully...`);

  if (server) {
    server.close(() => {
      console.log("> Server closed successfully");
      app.close(() => {
        console.log("> Next.js app closed successfully");
        process.exit(0);
      });
    });
  } else {
    process.exit(0);
  }
};

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("> Uncaught Exception:", error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("> Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

app
  .prepare()
  .then(() => {
    server = createServer((req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
      } catch (error) {
        console.error("> Server error:", error);
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    });

    server.listen(port, (err) => {
      if (err) {
        console.error("> Failed to start server:", err);
        process.exit(1);
      }

      console.log(
        `> Server ready and listening at http://localhost:${port} as ${
          dev ? "development" : process.env.NODE_ENV
        }`
      );

      // Signal to PM2 that the app is ready
      if (process.send) {
        process.send("ready");
      }
    });

    server.on("error", (error) => {
      console.error("> Server error:", error);
      process.exit(1);
    });
  })
  .catch((error) => {
    console.error("> Failed to prepare Next.js app:", error);
    process.exit(1);
  });
