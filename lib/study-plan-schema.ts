import { z } from "zod"

// Schema for a single day's schedule
export const StudyPlanDaySchema = z.object({
    focus: z.string(),
    tasks: z.array(z.string()),
    resources: z.array(z.string()).optional(),
})

// Schema for the entire schedule (Day 1, Day 2, etc.)
export const StudyPlanScheduleSchema = z.record(z.string(), StudyPlanDaySchema)

// Schema for the AI response
export const AIPlanResponseSchema = z.object({
    title: z.string(),
    description: z.string(),
    schedule: StudyPlanScheduleSchema,
})

// Inferred TypeScript types
export type StudyPlanDay = z.infer<typeof StudyPlanDaySchema>
export type StudyPlanSchedule = z.infer<typeof StudyPlanScheduleSchema>
export type AIPlanResponse = z.infer<typeof AIPlanResponseSchema>
