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
      // Fetch halaman target
      const response = await fetch(`https://${targetUrl}`);
      if (!response.ok) throw new Error(`Gagal mengambil halaman: ${response.statusText}`);

      let images = [];

      // Gunakan HTMLRewriter untuk menangkap gambar
      const rewriter = new HTMLRewriter()
        .on("img", {
          element(element) {
            let src = element.getAttribute("data-src") || element.getAttribute("src") || element.getAttribute("srcset");

            if (src) {
              // Ubah URL relatif jadi absolut
              if (!src.startsWith("http")) {
                src = new URL(src, `https://${targetUrl}`).href;
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
      await rewriter.transform(response).text();

      return new Response(JSON.stringify({ images }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
