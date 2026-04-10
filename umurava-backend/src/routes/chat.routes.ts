import { Router, Response } from "express";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.post("/", protect, async (req: any, res: Response) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      res.status(400).json({
        success: false,
        message: "Message is required",
      });
      return;
    }

    console.log(`💬 Chat received: ${message}`);

    const { chatWithRecruiter } = await import("../services/ai.service");
    const response = await chatWithRecruiter(message, context || {});

    res.json({ success: true, response });

  } catch (error: any) {
    console.error("❌ Chat error:", error.message);

    // Handle quota error
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      res.status(200).json({
        success: true,
        response: "⚠️ AI chat is temporarily unavailable due to API quota limits. Please try again later.",
      });
      return;
    }

    // Handle API key error
    if (error.message?.includes("API key") || error.message?.includes("401")) {
      res.status(200).json({
        success: true,
        response: "⚠️ AI chat requires a valid Gemini API key to work.",
      });
      return;
    }

    // Handle any other error — return 200 with message instead of 500
    res.status(200).json({
      success: true,
      response: "⚠️ AI assistant is currently unavailable. Please ensure your Gemini API key is configured correctly.",
    });
  }
});

export default router;