import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"
import { AIPlanResponseSchema } from "@/lib/study-plan-schema"

export async function POST(req: Request) {
  try {
    const { topic, goal, days, hoursPerDay } = await req.json()

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    })

    const prompt = `Create a ${days}-day study plan for learning "${topic}".
      Goal: ${goal}
      Time available: ${hoursPerDay} hours per day.
      
      Return ONLY a JSON object with this strict schema:
      {
        "title": "Study Plan Title",
        "description": "Brief description",
        "schedule": {
          "Day 1": {
            "focus": "Main topic",
            "tasks": ["Task 1", "Task 2"],
            "resources": ["Resource 1"]
          }
        }
      }
      
      Ensure "resources" is an array of strings (optional).`

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    try {
      // Parse JSON
      let planData
      try {
        // First try direct parse in case it's clean JSON
        planData = JSON.parse(text)
      } catch {
        // Fallback to cleaning markdown
        const jsonString = text.replace(/```json\n?|\n?```/g, "").trim()
        planData = JSON.parse(jsonString)
      }

      // Validate with Zod
      const validatedData = AIPlanResponseSchema.parse(planData)

      return NextResponse.json(validatedData)
    } catch (e) {
      console.error("Failed to parse or validate AI response:", text, e)
      return NextResponse.json({ error: "Failed to generate a valid study plan. Please try again." }, { status: 500 })
    }

  } catch (error) {
    console.error("Error generating study plan:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
