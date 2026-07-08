import { startServer } from "../server.js";

let cachedApp: any = null;

export default async function handler(req: any, res: any) {
  try {
    if (!cachedApp) {
      console.log("Initializing server instance for Vercel serverless environment...");
      cachedApp = await startServer();
    }
    return cachedApp(req, res);
  } catch (error) {
    console.error("Vercel serverless function execution failed:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
