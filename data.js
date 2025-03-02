export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Cegah error favicon
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
      // Pastikan URL memiliki protokol (http/https)
      const finalUrl = targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`;

      // Header dengan User-Agent browser agar tidak dianggap bot
      const headers = {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      };

      // Fetch halaman target dengan header tambahan
      const response = await fetch(finalUrl, { headers });

      if (!response.ok) {
        throw new Error(`Gagal mengambil halaman: ${response.status} ${response.statusText}`);
      }

      let images = [];

      // Gunakan HTMLRewriter untuk menangkap gambar
      const rewriter = new HTMLRewriter()
        .on("img", {
          element(element) {
            let src = element.getAttribute("data-src") || element.getAttribute("src");

            // Menangani srcset (ambil gambar terbesar)
            let srcset = element.getAttribute("srcset");
            if (!src && srcset) {
              const srcCandidates = srcset.split(",").map(item => item.trim().split(" ")[0]);
              src = srcCandidates[srcCandidates.length - 1]; // Ambil resolusi terbesar
            }

            if (src) {
              // Ubah URL relatif menjadi absolut
              if (!src.startsWith("http")) {
                src = new URL(src, finalUrl).href;
              }

              // Filter gambar yang tidak relevan
              const lowerSrc = src.toLowerCase();
              if (
                !lowerSrc.includes("logo") &&
                !lowerSrc.includes("icon") &&
                !lowerSrc.includes("placeholder") &&
                !lowerSrc.includes("default") &&
                !lowerSrc.endsWith(".svg") // Hindari ikon SVG
              ) {
                images.push(src);
              }
            }
          },
        });

      // Proses HTML dengan HTMLRewriter
      const transformedResponse = await rewriter.transform(response).text();

      return new Response(JSON.stringify({ images }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // ✅ CORS agar bisa diakses dari browser
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
