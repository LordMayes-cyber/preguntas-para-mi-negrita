import { proxy } from "../lib/proxy";
export async function GET(request: Request) { return proxy(request); }
export async function POST(request: Request) { return proxy(request); }
export async function PUT(request: Request) { return proxy(request); }
