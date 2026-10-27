import { safe, createRoom } from "@/lib/love-store";
export const POST = (request: Request) => safe(() => createRoom(request));
