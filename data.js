export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: "Parameter 'url' diperlukan" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const response = await fetch(`https://${targetUrl}`);
      if (!response.ok) throw new Error("Gagal mengambil halaman");
      const html = await response.text();

      // Menggunakan Cheerio dari CDN
      const cheerio = await import("https://esm.sh/cheerio");
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
