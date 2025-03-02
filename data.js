export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Cegah error karena favicon request
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

      const images = [];

      // Menggunakan Cloudflare HTMLRewriter untuk menangkap gambar
      const rewriter = new HTMLRewriter()
        .on("img", {
          element(element) {
            let src = element.getAttribute("src");
            if (src && !src.startsWith("http")) {
              src = new URL(src, `https://${targetUrl}`).href;
            }
            if (src) images.push(src);
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
