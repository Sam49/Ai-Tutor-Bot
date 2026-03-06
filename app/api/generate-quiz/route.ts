import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"
import { QuizResponseSchema } from "@/lib/quiz-schema"

export async function POST(req: Request) {
    try {
        const { topic, title, description, difficulty, content } = await req.json()

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

        const prompt = `Create a comprehensive quiz about "${topic}" with the following requirements:

Title: ${title}
Description: ${description}
Difficulty: ${difficulty}
${content ? `Additional Content: ${content}` : ""}

Generate exactly 10 questions with a mix of:
- 6 multiple choice questions (4 options each)
- 2 true/false questions  
- 2 short answer questions

For each question, provide:
- Clear, educational question text
- Correct answer
- Detailed explanation of why the answer is correct
- Point value (1-3 points based on difficulty)

Return ONLY a JSON object with this strict schema:
{
  "questions": [
    {
      "type": "multiple_choice",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Detailed explanation here",
      "points": 2
    },
    {
      "type": "true_false", 
      "question": "Statement to evaluate",
      "correct_answer": "true",
      "explanation": "Why this is true/false",
      "points": 1
    },
    {
      "type": "short_answer",
      "question": "Question requiring brief answer?",
      "correct_answer": "Expected answer",
      "explanation": "What makes this the correct answer",
      "points": 3
    }
  ]
}`

        const result = await model.generateContent(prompt)
        const response = result.response
        const text = response.text()

        try {
            // Parse JSON
            let quizData
            try {
                // First try direct parse in case it's clean JSON
                quizData = JSON.parse(text)
            } catch {
                // Fallback to cleaning markdown
                const jsonString = text.replace(/```json\n?|\n?```/g, "").trim()
                quizData = JSON.parse(jsonString)
            }

            // Validate with Zod
            // We parse just the questions part or the whole object depending on what the model returns.
            // The prompt asks for { "questions": [...] }, so we expect that structure.
            const validatedData = QuizResponseSchema.parse(quizData)

            return NextResponse.json(validatedData)
        } catch (parseError) {
            console.error("Parse Error:", parseError)
            console.error("Raw AI Response:", text)
            return NextResponse.json({ error: "Failed to parse AI response. Please try again." }, { status: 500 })
        }

    } catch (error) {
        console.error("Quiz Generation Error:", error)
        return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 })
    }
}
