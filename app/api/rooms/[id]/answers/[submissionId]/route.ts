import { safe, getReceipt } from "@/lib/love-store";
export const GET = (_request: Request, context: { params: Promise<{ id: string; submissionId: string }> }) => safe(async () => { const p = await context.params; return getReceipt(p.id, p.submissionId); });
