import { NextResponse } from "next/server";

export async function GET(request: Request) { const secret=process.env.CRON_SECRET; if(!secret)return NextResponse.json({error:"Cron secret is not configured"},{status:503}); if(request.headers.get("authorization")!==`Bearer ${secret}`)return NextResponse.json({error:"Unauthorized"},{status:401}); return NextResponse.json({error:"Scheduled report delivery requires a configured email provider"},{status:503}); }
