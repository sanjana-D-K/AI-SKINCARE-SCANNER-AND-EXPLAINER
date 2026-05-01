import { ScanResponse, SearchResponse, SkinType } from "./types";

// In dev: points directly to the FastAPI backend (avoids Next.js proxy body-size limits)
// In prod: set NEXT_PUBLIC_API_URL to your deployed backend URL
const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "") + "/api";

export async function scanProduct(
  image: File,
  skinType: SkinType
): Promise<ScanResponse> {
  const form = new FormData();
  form.append("image", image);
  form.append("skin_type", skinType);

  let res: Response;
  try {
    res = await fetch(`${BASE}/scan`, { method: "POST", body: form });
  } catch (err) {
    console.error("Fetch error:", err);
    throw new Error(
      "Could not reach the server. Make sure the backend is running on port 8000."
    );
  }

  if (!res.ok) {
    let detail = `Server error (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {
      try {
        const text = await res.text();
        if (text) detail = text.slice(0, 300);
      } catch { /* ignore */ }
    }
    throw new Error(detail);
  }

  return res.json();
}

export async function searchIngredients(
  query: string,
  skinType: SkinType = "combination"
): Promise<SearchResponse> {
  const params = new URLSearchParams({ q: query, skin_type: skinType });
  let res: Response;
  try {
    res = await fetch(`${BASE}/search?${params}`);
  } catch {
    throw new Error("Search request failed.");
  }
  if (!res.ok) throw new Error("Search failed.");
  return res.json();
}
