import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  if (!search || search.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const authId = process.env.SMARTY_AUTH_ID;
    const authToken = process.env.SMARTY_AUTH_TOKEN;

    if (!authId || !authToken) {
      console.error("❌ Smarty API keys not found in .env.local");
      return NextResponse.json({ suggestions: [] });
    }

    const url = `https://us-autocomplete-pro.api.smarty.com/lookup?search=${encodeURIComponent(search)}&max_results=5&auth-id=${authId}&auth-token=${authToken}`;

    const response = await fetch(url);
    const data = await response.json();

    // console.log("✅ Smarty response:", JSON.stringify(data));

    return NextResponse.json({
      suggestions: data.suggestions || [],
    });

  } catch (error) {
    console.error("❌ Smarty API error:", error);
    return NextResponse.json({ suggestions: [] });
  }
}