import { safe, submitAnswers } from "@/lib/love-store";
export const POST = (request: Request, context: { params: Promise<{ id: string }> }) => safe(async () => submitAnswers(request, (await context.params).id));
