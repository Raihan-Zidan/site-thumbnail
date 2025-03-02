export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Cegah error karena favicon request
    if (url.pathname === "/favicon.ico") {
      return new Response(null, { status: 204 }); // No Content
    }

    const targetUrl = url.searchParams.get("url");
    if (!targetUrl) {
      return new Response(JSON.stringify({ error: "Parameter 'url' diperlukan" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const response = await fetch(`https://${targetUrl}`);
      if (!response.ok) throw new Error(`Gagal mengambil halaman: ${response.statusText}`);
      const html = await response.text();

      // Gunakan Cheerio dari CDN dengan error handling
      let cheerio;
      try {
        cheerio = await import("https://esm.sh/cheerio");
      } catch (err) {
        throw new Error("Gagal memuat Cheerio");
      }

      const $ = cheerio.load(html);
      let images = [];

      $("img").each((i, img) => {
        let src = $(img).attr("src");
        if (src && !src.startsWith("http")) {
          src = new URL(src, `https://${targetUrl}`).href;
        }
        images.push(src);
      });

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
