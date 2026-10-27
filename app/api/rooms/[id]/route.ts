import { safe, getRoom, updateRoom } from "@/lib/love-store";
type Context = { params: Promise<{ id: string }> };
export const GET = (request: Request, context: Context) => safe(async () => getRoom(request, (await context.params).id));
export const PUT = (request: Request, context: Context) => safe(async () => updateRoom(request, (await context.params).id));
