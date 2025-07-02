import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { AuthOption } from "lib/auth";

export const GET = async (req: NextRequest) => {
  try {
    const session = await getServerSession(AuthOption);

    if (session?.user) {
      return NextResponse.json(
        { user: session.user },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: "User was not logged in" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error at User Req", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
