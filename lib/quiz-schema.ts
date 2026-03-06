import { z } from "zod"

export const QuizQuestionSchema = z.object({
    type: z.enum(["multiple_choice", "true_false", "short_answer"]),
    question: z.string(),
    options: z.array(z.string()).optional(),
    correct_answer: z.string(),
    explanation: z.string(),
    points: z.number().int().positive(),
})

export const QuizResponseSchema = z.object({
    questions: z.array(QuizQuestionSchema),
})

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>
export type QuizResponse = z.infer<typeof QuizResponseSchema>
