import { z } from "zod";

export const createCommentSchema = z.object({
    content: z.string().min(1, "Comment content cannot be empty"),
    taskId: z.string().uuid("Invalid taskId format"),
});
