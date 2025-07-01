import db from "@repo/db/db";
import { NextRequest } from "next/server";

export async function GET(req:NextRequest) {
    return Response.json({
        message:"Hello there"
    },{status:200})
}