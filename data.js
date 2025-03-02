export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/favicon.ico") {
      return new Response(null, { status: 204 });
    }

    const targetUrl = url.searchParams.get("url");
    if (!targetUrl) {
      return new Response(JSON.stringify({ error: "Parameter 'url' diperlukan" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const finalUrl = targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`;

      const headers = {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      };

      const response = await fetch(finalUrl, { headers });

      if (!response.ok) {
        throw new Error(`Gagal mengambil halaman: ${response.status} ${response.statusText}`);
      }

      let images = [];

      const blockedPatterns = [
        "logo",
        "icon",
        "placeholder",
        "default",
        "badge",
        "avatar",
        "user-verified",
        "transparent",
        "spacer",
        "blank",
      ];

      const rewriter = new HTMLRewriter()
        .on("img", {
          element(element) {
            let src = element.getAttribute("data-src") || element.getAttribute("src");

            let srcset = element.getAttribute("srcset");
            if (!src && srcset) {
              const srcCandidates = srcset.split(",").map(item => item.trim().split(" ")[0]);
              src = srcCandidates[srcCandidates.length - 1];
            }

            if (src) {
              if (!src.startsWith("http")) {
                src = new URL(src, finalUrl).href;
              }

              const lowerSrc = src.toLowerCase();

              // ❌ Abaikan gambar jika URL mengandung kata dalam blockedPatterns
              if (blockedPatterns.some(pattern => lowerSrc.includes(pattern))) {
                return;
              }

              images.push(src);
            }
          },
        });

      await rewriter.transform(response).text();

      return new Response(JSON.stringify({ images }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "*"
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
